// Mock Market Prices Service
// TODO: Replace with actual Government API integration

export interface MarketPrice {
  id: string;
  date: string;
  state: string;
  district: string;
  mandi: string;
  crop: string;
  variety: string;
  unit: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  source: string;
}

export interface MarketPriceFilters {
  crop: string;
  state: string;
  district: string;
  date: string;
}

export interface MarketPricesResponse {
  data: MarketPrice[];
  page: number;
  pageSize: number;
  total: number;
  lastUpdated: string;
}

// Mock data generator
const MOCK_CROPS = ["Wheat", "Rice", "Tomato", "Onion", "Potato", "Cotton", "Sugarcane", "Soybean"];
const MOCK_STATES = ["Maharashtra", "Karnataka", "Uttar Pradesh", "Gujarat", "Punjab"];
const MOCK_DISTRICTS = {
  "Maharashtra": ["Pune", "Mumbai", "Nashik", "Nagpur"],
  "Karnataka": ["Bengaluru", "Mysuru", "Belagavi", "Hubli-Dharwad"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra", "Varanasi"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala"]
};

const generateMockData = (count: number = 100): MarketPrice[] => {
  const data: MarketPrice[] = [];
  const today = new Date();
  
  for (let i = 0; i < count; i++) {
    const state = MOCK_STATES[Math.floor(Math.random() * MOCK_STATES.length)];
    const districts = MOCK_DISTRICTS[state as keyof typeof MOCK_DISTRICTS];
    const district = districts[Math.floor(Math.random() * districts.length)];
    const crop = MOCK_CROPS[Math.floor(Math.random() * MOCK_CROPS.length)];
    
    // Generate price based on crop type
    const basePrice = {
      "Wheat": 2000,
      "Rice": 2500,
      "Tomato": 1200,
      "Onion": 1500,
      "Potato": 800,
      "Cotton": 5000,
      "Sugarcane": 300,
      "Soybean": 4000
    }[crop] || 1000;
    
    const variation = 0.3; // 30% variation
    const minPrice = Math.floor(basePrice * (1 - variation + Math.random() * variation));
    const maxPrice = Math.floor(basePrice * (1 + Math.random() * variation));
    const modalPrice = Math.floor((minPrice + maxPrice) / 2 + (Math.random() - 0.5) * 200);
    
    // Random date within last 7 days
    const date = new Date(today);
    date.setDate(today.getDate() - Math.floor(Math.random() * 7));
    
    data.push({
      id: `MP${i + 1}`,
      date: date.toISOString().split('T')[0],
      state,
      district,
      mandi: district, // Using district as mandi for simplicity
      crop,
      variety: crop === "Tomato" ? "Hybrid" : crop === "Rice" ? "Basmati" : "Grade A",
      unit: "₹/quintal",
      minPrice,
      maxPrice,
      modalPrice,
      source: "Govt API"
    });
  }
  
  return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Cache management
const CACHE_KEY = 'farmiq-market-prices';
const CACHE_TIMESTAMP_KEY = 'farmiq-market-prices-timestamp';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

class MarketPricesService {
  private mockData: MarketPrice[];
  
  constructor() {
    this.mockData = generateMockData(500); // Generate 500 mock records
  }

  private getCachedData(): MarketPrice[] | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      
      if (cached && timestamp) {
        const cacheTime = parseInt(timestamp, 10);
        const now = Date.now();
        
        if (now - cacheTime < CACHE_DURATION) {
          return JSON.parse(cached);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  }

  private setCachedData(data: MarketPrice[]): void {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.error('Error writing cache:', error);
    }
  }

  private filterData(data: MarketPrice[], filters: MarketPriceFilters): MarketPrice[] {
    return data.filter(item => {
      if (filters.crop && item.crop !== filters.crop) return false;
      if (filters.state && item.state !== filters.state) return false;
      if (filters.district && item.district !== filters.district) return false;
      if (filters.date && item.date !== filters.date) return false;
      return true;
    });
  }

  private sortData(data: MarketPrice[], sortString: string): MarketPrice[] {
    const [field, direction] = sortString.split(':');
    const sortField = field as keyof MarketPrice;
    
    return [...data].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      // Handle numeric fields
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      // Handle string fields
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return direction === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      return 0;
    });
  }

  private paginateData(data: MarketPrice[], page: number, pageSize: number) {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  }

  async getPrices(
    filters: MarketPriceFilters,
    page: number = 1,
    pageSize: number = 25,
    sort: string = 'date:desc'
  ): Promise<MarketPricesResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
    
    // Check cache first
    let data = this.getCachedData();
    
    if (!data) {
      // Simulate fetching from API
      data = this.mockData;
      this.setCachedData(data);
    }
    
    // Apply filters
    const filteredData = this.filterData(data, filters);
    
    // Apply sorting
    const sortedData = this.sortData(filteredData, sort);
    
    // Apply pagination
    const paginatedData = this.paginateData(sortedData, page, pageSize);
    
    return {
      data: paginatedData,
      page,
      pageSize,
      total: filteredData.length,
      lastUpdated: new Date().toISOString()
    };
  }

  async getLastUpdated(): Promise<{ lastUpdated: string; nextRefreshInSeconds: number }> {
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    const lastUpdated = timestamp 
      ? new Date(parseInt(timestamp, 10)).toISOString()
      : new Date().toISOString();
    
    const cacheTime = timestamp ? parseInt(timestamp, 10) : Date.now();
    const nextRefreshTime = cacheTime + CACHE_DURATION;
    const nextRefreshInSeconds = Math.max(0, Math.floor((nextRefreshTime - Date.now()) / 1000));
    
    return {
      lastUpdated,
      nextRefreshInSeconds
    };
  }

  exportToCSV(data: MarketPrice[], filters: MarketPriceFilters): void {
    if (data.length === 0) {
      throw new Error('No data to export');
    }

    // Create CSV headers
    const headers = [
      'Date', 'State', 'District/Mandi', 'Crop', 'Variety', 'Unit',
      'Min Price (₹)', 'Max Price (₹)', 'Modal Price (₹)', 'Source'
    ];

    // Create CSV rows
    const rows = data.map(item => [
      item.date,
      item.state,
      item.mandi,
      item.crop,
      item.variety,
      item.unit,
      item.minPrice.toString(),
      item.maxPrice.toString(),
      item.modalPrice.toString(),
      item.source
    ]);

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      // Generate filename with filters
      const filterParts = [];
      if (filters.crop) filterParts.push(filters.crop);
      if (filters.state) filterParts.push(filters.state);
      if (filters.district) filterParts.push(filters.district);
      
      const filterString = filterParts.length > 0 ? `_${filterParts.join('_')}` : '';
      const today = new Date().toISOString().split('T')[0];
      const filename = `FarmIQ_MarketPrices_${today}${filterString}.csv`;
      
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Force refresh data (for manual refresh)
  async refreshData(): Promise<void> {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    // In real implementation, this would fetch fresh data from API
    this.mockData = generateMockData(500);
  }
}

export const marketPricesService = new MarketPricesService();