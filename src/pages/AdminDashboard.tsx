import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Users, Settings, BarChart3 } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/login')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Login</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground">Manage the FarmIQ platform</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Coming Soon Card */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold">Admin Dashboard Coming Soon</CardTitle>
            <CardDescription className="text-lg">
              We're building a comprehensive admin panel for platform management.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-6">
                The admin dashboard will provide tools for user management, system monitoring, 
                content moderation, and platform analytics to ensure smooth operations.
              </p>
            </div>

            {/* Feature Preview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold">User Management</h3>
                <p className="text-sm text-muted-foreground">
                  Manage farmers, vendors, and platform users
                </p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <Settings className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold">System Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Configure platform settings and preferences
                </p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold">Analytics & Monitoring</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor platform performance and usage
                </p>
              </div>
            </div>

            <div className="text-center pt-4">
              <Button onClick={() => navigate('/login')} variant="outline">
                Return to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
