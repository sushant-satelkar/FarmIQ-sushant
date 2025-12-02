import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FarmIQNavbar } from '@/components/farmiq/FarmIQNavbar';
import { Cpu, RefreshCw, AlertTriangle, CheckCircle, Clock, MapPin, Phone, Calendar, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import RequestForm from '@/components/iot/RequestForm';
import StatusTimeline from '@/components/iot/StatusTimeline';
import LiveReadings from '@/components/iot/LiveReadings';
import { iotService } from '@/services/iotService';
import { useToast } from '@/hooks/use-toast';

interface InstallationRequest {
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

const IoTSensor = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeRequest, setActiveRequest] = useState<InstallationRequest | null>(null);
  const [isLoadingRequest, setIsLoadingRequest] = useState(true);
  const [activeTab, setActiveTab] = useState('request');

  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState<'English' | 'Hindi' | 'Punjabi'>('English');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Load active request on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadActiveRequest();
    }
  }, [isAuthenticated]);

  const loadActiveRequest = async () => {
    try {
      setIsLoadingRequest(true);
      const request = await iotService.getStatus();
      setActiveRequest(request);
      
      // If installed, show live readings tab
      if (request?.status === 'installed') {
        setActiveTab('readings');
      }
    } catch (error) {
      console.error('Error loading IoT status:', error);
    } finally {
      setIsLoadingRequest(false);
    }
  };

  const handleRequestSubmit = async (requestData: any) => {
    try {
      const newRequest = await iotService.createRequest(requestData);
      setActiveRequest(newRequest);
      setActiveTab('request');
      toast({
        title: 'Request Submitted',
        description: 'Your IoT sensor installation request has been submitted. Technician allocated.',
      });
    } catch (error) {
      console.error('Error creating request:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit request. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleReschedule = async (newDate: string, newWindow: string) => {
    if (!activeRequest) return;
    
    try {
      const updatedRequest = await iotService.reschedule(activeRequest.id, newDate, newWindow);
      setActiveRequest(updatedRequest);
      toast({
        title: 'Appointment Rescheduled',
        description: 'Your appointment has been rescheduled successfully.',
      });
    } catch (error) {
      console.error('Error rescheduling:', error);
      toast({
        title: 'Error',
        description: 'Failed to reschedule. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = async () => {
    if (!activeRequest) return;
    
    try {
      await iotService.cancel(activeRequest.id);
      setActiveRequest(null);
      setActiveTab('request');
      toast({
        title: 'Request Cancelled',
        description: 'Your IoT sensor installation request has been cancelled.',
      });
    } catch (error) {
      console.error('Error cancelling:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel request. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark');
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <FarmIQNavbar 
        theme={theme}
        language={language}
        onThemeToggle={toggleTheme}
        onLanguageChange={setLanguage}
      />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Cpu className="h-8 w-8 text-primary" />
                IoT Sensor
              </h1>
              <p className="text-muted-foreground mt-2">
                Request installation, track status, and view farm readings.
              </p>
            </div>
            
            {activeRequest && activeRequest.status !== 'cancelled' && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reschedule
                </Button>
                <Button variant="outline" size="sm">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Cancel Request
                </Button>
                <Button variant="outline" size="sm">
                  <Phone className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="request">Request & Status</TabsTrigger>
            <TabsTrigger value="readings">Live Readings</TabsTrigger>
          </TabsList>

          <TabsContent value="request" className="mt-6">
            {isLoadingRequest ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading status...</p>
                </div>
              </div>
            ) : activeRequest ? (
              <StatusTimeline 
                request={activeRequest}
                onReschedule={handleReschedule}
                onCancel={handleCancel}
                onGoToReadings={() => setActiveTab('readings')}
              />
            ) : (
              <RequestForm 
                farmerName={user?.name || ''}
                onSubmit={handleRequestSubmit}
              />
            )}
          </TabsContent>

          <TabsContent value="readings" className="mt-6">
            <LiveReadings isInstalled={activeRequest?.status === 'installed'} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default IoTSensor;
