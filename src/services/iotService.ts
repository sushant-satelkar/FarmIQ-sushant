// IoT Sensor Service for FarmIQ
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD 
    ? 'https://farm-backend-dqsw.onrender.com/api'
    : 'http://localhost:3001/api');

export interface InstallationRequest {
  id: string;
  farmerName: string;
  phone: string;
  location: {
    lat?: number;
    lon?: number;
    state?: string;
    district?: string;
    village?: string;
    landmark?: string;
  };
  preferredDate: string;
  preferredWindow: 'Morning' | 'Afternoon' | 'Evening';
  notes?: string;
  status: 'requested' | 'allocated' | 'scheduled' | 'installed' | 'cancelled';
  technician?: {
    id: string;
    name: string;
    phone: string;
    rating?: number;
  };
  appointment?: {
    date: string;
    window: string;
  };
  createdAt: string;
}

export interface Reading {
  timestamp: string;
  temperatureC: number;
  humidityPct: number;
  soilMoisturePct: number;
  lightLevel: 'Low' | 'Medium' | 'High';
}

export interface Alert {
  id: string;
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

// Mock technician data
const technicians = [
  { id: 'T1', name: 'Ravi Kumar', phone: '9876543210', activeJobsCount: 2 },
  { id: 'T2', name: 'Simran Kaur', phone: '9876501234', activeJobsCount: 1 },
  { id: 'T3', name: 'Arjun Mehta', phone: '9876512345', activeJobsCount: 0 },
];

// Mock data storage (in real app, this would be in database)
let mockRequests: InstallationRequest[] = [];
let mockReadings: Reading[] = [];
let mockAlerts: Alert[] = [];

// Generate mock readings for the last 24 hours
const generateMockReadings = (): Reading[] => {
  const readings: Reading[] = [];
  const now = new Date();
  
  for (let i = 23; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    readings.push({
      timestamp: timestamp.toISOString(),
      temperatureC: Math.round((28 + Math.sin(i / 4) * 5 + Math.random() * 2) * 10) / 10,
      humidityPct: Math.round((65 + Math.cos(i / 3) * 10 + Math.random() * 5)),
      soilMoisturePct: Math.round((45 + Math.sin(i / 2) * 15 + Math.random() * 10)),
      lightLevel: i >= 6 && i <= 18 ? 
        (Math.random() > 0.5 ? 'High' : 'Medium') : 'Low'
    });
  }
  
  return readings;
};

// Generate mock alerts
const generateMockAlerts = (): Alert[] => {
  return [
    {
      id: 'A1',
      type: 'moisture',
      message: 'Low moisture detected — consider light irrigation',
      severity: 'medium'
    },
    {
      id: 'A2',
      type: 'temperature',
      message: 'High temperature in afternoon — monitor crop stress',
      severity: 'low'
    }
  ];
};

// Initialize mock data
mockReadings = generateMockReadings();
mockAlerts = generateMockAlerts();

class IoTService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log('Making IoT request to:', url);
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Request failed: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('IoT service error:', error);
      // For now, return mock data if API fails
      return this.getMockData(endpoint, options);
    }
  }

  private getMockData(endpoint: string, options: RequestInit): any {
    switch (endpoint) {
      case '/iot/status':
        return mockRequests.length > 0 ? mockRequests[0] : null;
      
      case '/iot/request':
        if (options.method === 'POST') {
          const requestData = JSON.parse((options.body as string) || '{}');
          const newRequest: InstallationRequest = {
            id: `IOT-2025-${String(mockRequests.length + 1).padStart(6, '0')}`,
            ...requestData,
            status: 'allocated',
            technician: this.allocateTechnician(),
            appointment: {
              date: requestData.preferredDate,
              window: requestData.preferredWindow
            },
            createdAt: new Date().toISOString()
          };
          mockRequests = [newRequest];
          return newRequest;
        }
        break;
      
      case '/iot/reschedule':
        if (options.method === 'POST') {
          const { id, newDate, newWindow } = JSON.parse((options.body as string) || '{}');
          const request = mockRequests.find(r => r.id === id);
          if (request) {
            request.appointment = { date: newDate, window: newWindow };
            request.status = 'scheduled';
            return request;
          }
        }
        break;
      
      case '/iot/cancel':
        if (options.method === 'POST') {
          const { id } = JSON.parse((options.body as string) || '{}');
          mockRequests = mockRequests.filter(r => r.id !== id);
          return { ok: true };
        }
        break;
      
      case '/iot/readings':
        return mockReadings;
      
      case '/iot/alerts':
        return mockAlerts;
    }
    
    return null;
  }

  private allocateTechnician() {
    // Find technician with lowest active job count
    const technician = technicians.reduce((min, tech) => 
      tech.activeJobsCount < min.activeJobsCount ? tech : min
    );
    
    // Increment their active job count
    technician.activeJobsCount++;
    
    return {
      id: technician.id,
      name: technician.name,
      phone: technician.phone,
      rating: 4.5
    };
  }

  async createRequest(requestData: Partial<InstallationRequest>): Promise<InstallationRequest> {
    return this.makeRequest<InstallationRequest>('/iot/request', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  async getStatus(): Promise<InstallationRequest | null> {
    return this.makeRequest<InstallationRequest | null>('/iot/status');
  }

  async reschedule(id: string, newDate: string, newWindow: string): Promise<InstallationRequest> {
    return this.makeRequest<InstallationRequest>('/iot/reschedule', {
      method: 'POST',
      body: JSON.stringify({ id, newDate, newWindow }),
    });
  }

  async cancel(id: string): Promise<{ ok: boolean }> {
    return this.makeRequest<{ ok: boolean }>('/iot/cancel', {
      method: 'POST',
      body: JSON.stringify({ id }),
    });
  }

  async getReadings(since?: string): Promise<Reading[]> {
    const params = since ? `?since=${since}` : '';
    return this.makeRequest<Reading[]>(`/iot/readings${params}`);
  }

  async getAlerts(): Promise<Alert[]> {
    return this.makeRequest<Alert[]>('/iot/alerts');
  }

  // Mock method to simulate sensor installation
  async markAsInstalled(id: string): Promise<InstallationRequest> {
    const request = mockRequests.find(r => r.id === id);
    if (request) {
      request.status = 'installed';
      return request;
    }
    throw new Error('Request not found');
  }
}

export const iotService = new IoTService();
