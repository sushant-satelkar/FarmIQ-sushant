import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, Thermometer, Droplets, Sun, Eye, AlertTriangle, Wifi, WifiOff, Settings } from 'lucide-react';
import { iotService, Reading, Alert } from '@/services/iotService';
import { useToast } from '@/hooks/use-toast';

interface LiveReadingsProps {
  isInstalled: boolean;
}

export default function LiveReadings({ isInstalled }: LiveReadingsProps) {
  const { toast } = useToast();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [settings, setSettings] = useState({
    temperatureUnit: 'C' as 'C' | 'F',
    dailySummary: true,
    alerts: true,
  });

  // Load readings and alerts
  const loadData = async () => {
    if (!isInstalled) return;
    
    setIsLoading(true);
    try {
      const [readingsData, alertsData] = await Promise.all([
        iotService.getReadings(),
        iotService.getAlerts(),
      ]);
      
      setReadings(readingsData);
      setAlerts(alertsData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading readings:', error);
      setIsOffline(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount and when installation status changes
  useEffect(() => {
    loadData();
  }, [isInstalled]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!isInstalled) return;
    
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isInstalled]);

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRefresh = () => {
    loadData();
    toast({
      title: 'Refreshed',
      description: 'Readings have been updated.',
    });
  };

  const handleSettingsSave = () => {
    toast({
      title: 'Settings Saved',
      description: 'Your preferences have been updated.',
    });
  };

  const convertTemperature = (celsius: number) => {
    if (settings.temperatureUnit === 'F') {
      return Math.round((celsius * 9/5 + 32) * 10) / 10;
    }
    return celsius;
  };

  const getTemperatureUnit = () => {
    return settings.temperatureUnit === 'F' ? '°F' : '°C';
  };

  const getLightLevelColor = (level: string) => {
    switch (level) {
      case 'High': return 'text-green-600';
      case 'Medium': return 'text-yellow-600';
      case 'Low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-200 bg-red-50 text-red-800';
      case 'medium': return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'low': return 'border-blue-200 bg-blue-50 text-blue-800';
      default: return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  // Generate simple trend data (mock)
  const generateTrendData = (values: number[]) => {
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min;
    
    return values.map(value => {
      const normalized = range > 0 ? (value - min) / range : 0.5;
      return Math.round(normalized * 100);
    });
  };

  if (!isInstalled) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Settings className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Sensor isn't active yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Your IoT sensor needs to be installed before you can view live readings.
            </p>
            <Button variant="outline">
              Back to Status
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentReading = readings[0];
  const temperatureValues = readings.map(r => r.temperatureC);
  const humidityValues = readings.map(r => r.humidityPct);
  const moistureValues = readings.map(r => r.soilMoisturePct);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Offline Banner */}
      {isOffline && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <WifiOff className="h-5 w-5 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                You're offline. Showing last saved readings.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live Farm Readings</h2>
          <p className="text-muted-foreground">
            Real-time monitoring of your farm conditions
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <Button 
            onClick={handleRefresh} 
            disabled={isLoading}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Reading Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Soil Moisture */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">Soil Moisture</span>
              </div>
              <Badge variant="secondary">{currentReading?.soilMoisturePct || 0}%</Badge>
            </div>
            <div className="text-3xl font-bold mb-2">
              {currentReading?.soilMoisturePct || 0}%
            </div>
            <div className="text-xs text-muted-foreground">
              {currentReading?.soilMoisturePct && currentReading.soilMoisturePct < 30 ? 'Low' : 
               currentReading?.soilMoisturePct && currentReading.soilMoisturePct > 70 ? 'High' : 'Normal'}
            </div>
            {/* Mini trend */}
            <div className="flex items-end gap-1 mt-2 h-8">
              {generateTrendData(moistureValues.slice(-12)).map((height, i) => (
                <div
                  key={i}
                  className="bg-blue-200 rounded-sm flex-1"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Temperature */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Thermometer className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium">Temperature</span>
              </div>
              <Badge variant="secondary">
                {convertTemperature(currentReading?.temperatureC || 0)}{getTemperatureUnit()}
              </Badge>
            </div>
            <div className="text-3xl font-bold mb-2">
              {convertTemperature(currentReading?.temperatureC || 0)}{getTemperatureUnit()}
            </div>
            <div className="text-xs text-muted-foreground">
              {currentReading?.temperatureC && currentReading.temperatureC < 15 ? 'Cold' : 
               currentReading?.temperatureC && currentReading.temperatureC > 35 ? 'Hot' : 'Normal'}
            </div>
            {/* Mini trend */}
            <div className="flex items-end gap-1 mt-2 h-8">
              {generateTrendData(temperatureValues.slice(-12)).map((height, i) => (
                <div
                  key={i}
                  className="bg-red-200 rounded-sm flex-1"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Humidity */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">Humidity</span>
              </div>
              <Badge variant="secondary">{currentReading?.humidityPct || 0}%</Badge>
            </div>
            <div className="text-3xl font-bold mb-2">
              {currentReading?.humidityPct || 0}%
            </div>
            <div className="text-xs text-muted-foreground">
              {currentReading?.humidityPct && currentReading.humidityPct < 40 ? 'Dry' : 
               currentReading?.humidityPct && currentReading.humidityPct > 80 ? 'Humid' : 'Normal'}
            </div>
            {/* Mini trend */}
            <div className="flex items-end gap-1 mt-2 h-8">
              {generateTrendData(humidityValues.slice(-12)).map((height, i) => (
                <div
                  key={i}
                  className="bg-green-200 rounded-sm flex-1"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Light Level */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sun className="h-5 w-5 text-yellow-600" />
                <span className="text-sm font-medium">Light Level</span>
              </div>
              <Badge variant="secondary" className={getLightLevelColor(currentReading?.lightLevel || 'Low')}>
                {currentReading?.lightLevel || 'Low'}
              </Badge>
            </div>
            <div className="text-3xl font-bold mb-2">
              {currentReading?.lightLevel || 'Low'}
            </div>
            <div className="text-xs text-muted-foreground">
              {currentReading?.lightLevel === 'High' ? 'Bright' : 
               currentReading?.lightLevel === 'Medium' ? 'Moderate' : 'Low'}
            </div>
            {/* Mini trend */}
            <div className="flex items-end gap-1 mt-2 h-8">
              {readings.slice(-12).map((_, i) => (
                <div
                  key={i}
                  className="bg-yellow-200 rounded-sm flex-1"
                  style={{ height: '60%' }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Farm Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${getAlertSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <Button variant="ghost" size="sm" className="text-xs">
                      Dismiss
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="temperature-unit">Temperature Unit</Label>
                <p className="text-sm text-muted-foreground">Choose between Celsius and Fahrenheit</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={settings.temperatureUnit === 'C' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSettings(prev => ({ ...prev, temperatureUnit: 'C' }))}
                >
                  °C
                </Button>
                <Button
                  variant={settings.temperatureUnit === 'F' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSettings(prev => ({ ...prev, temperatureUnit: 'F' }))}
                >
                  °F
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="daily-summary">Daily Summary</Label>
                  <p className="text-sm text-muted-foreground">Receive daily farm condition reports</p>
                </div>
                <Switch
                  id="daily-summary"
                  checked={settings.dailySummary}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, dailySummary: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="alerts">Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified about important changes</p>
                </div>
                <Switch
                  id="alerts"
                  checked={settings.alerts}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, alerts: checked }))}
                />
              </div>
            </div>

            <Button onClick={handleSettingsSave} className="w-full">
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>24-Hour History</CardTitle>
          <CardDescription>Recent readings from your IoT sensor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Time</th>
                  <th className="text-left p-2">Temperature</th>
                  <th className="text-left p-2">Humidity</th>
                  <th className="text-left p-2">Moisture</th>
                  <th className="text-left p-2">Light</th>
                </tr>
              </thead>
              <tbody>
                {readings.slice(0, 12).map((reading, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">
                      {new Date(reading.timestamp).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="p-2">
                      {convertTemperature(reading.temperatureC)}{getTemperatureUnit()}
                    </td>
                    <td className="p-2">{reading.humidityPct}%</td>
                    <td className="p-2">{reading.soilMoisturePct}%</td>
                    <td className="p-2">
                      <Badge variant="outline" className={getLightLevelColor(reading.lightLevel)}>
                        {reading.lightLevel}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
