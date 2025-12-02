import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { authService, RegisterData } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';

// Validation schema (no username, aadhar)
const registerSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  phone: z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

type UserRole = 'farmer' | 'vendor' | 'admin';

const roleDescriptions = {
  farmer: 'Manage crops & field data',
  vendor: 'Connect with farmers & orders',
  admin: 'Oversee platform operations'
};

export default function Register() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<UserRole>('farmer');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const registerData: RegisterData = {
        role: selectedRole,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      };

      await authService.register(registerData);

      toast({
        title: 'Account Created',
        description: 'Your account has been created successfully. Please login to continue.',
      });

      navigate('/login');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setError(null);
    reset(); // Clear form when role changes
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50/50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="text-sm font-medium text-green-600 uppercase tracking-wide">
            CREATE ACCOUNT
          </div>
          <CardTitle className="text-2xl font-bold">
            Join the FarmIQ ecosystem
          </CardTitle>
          <CardDescription>
            Choose your role and unlock tailored eco-driven insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Role Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Choose your role</Label>
            <RadioGroup
              value={selectedRole}
              onValueChange={(value) => handleRoleChange(value as UserRole)}
              className="flex flex-col space-y-2"
            >
              <div
                className={`flex items-start space-x-3 border rounded-lg p-3 cursor-pointer transition-colors ${selectedRole === 'farmer' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}
                onClick={() => handleRoleChange('farmer')}
              >
                <RadioGroupItem value="farmer" id="farmer" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="farmer" className="cursor-pointer font-medium">
                    Farmer
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {roleDescriptions.farmer}
                  </p>
                </div>
              </div>
              <div
                className={`flex items-start space-x-3 border rounded-lg p-3 cursor-pointer transition-colors ${selectedRole === 'vendor' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}
                onClick={() => handleRoleChange('vendor')}
              >
                <RadioGroupItem value="vendor" id="vendor" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="vendor" className="cursor-pointer font-medium">
                    Vendor
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {roleDescriptions.vendor}
                  </p>
                </div>
              </div>
              <div
                className={`flex items-start space-x-3 border rounded-lg p-3 cursor-pointer transition-colors ${selectedRole === 'admin' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}
                onClick={() => handleRoleChange('admin')}
              >
                <RadioGroupItem value="admin" id="admin" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="admin" className="cursor-pointer font-medium">
                    Admin
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {roleDescriptions.admin}
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Registration Form (no username, aadhar) */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                type="text"
                placeholder="Priya Sharma"
                {...register('full_name')}
                aria-invalid={errors.full_name ? 'true' : 'false'}
              />
              {errors.full_name && (
                <p className="text-sm text-destructive">{errors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 98765 43210"
                {...register('phone')}
                aria-invalid={errors.phone ? 'true' : 'false'}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                aria-invalid={errors.email ? 'true' : 'false'}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  {...register('password')}
                  aria-invalid={errors.password ? 'true' : 'false'}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </form>

          {/* Login Link */}
          <div className="text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link
              to="/login"
              className="font-medium text-green-600 hover:text-green-700 hover:underline"
            >
              Login
            </Link>
          </div>

          {/* Terms */}
          <p className="text-xs text-center text-muted-foreground">
            By registering you agree to our platform policies and terms of use.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
