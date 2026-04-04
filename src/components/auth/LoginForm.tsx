'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Phone, Trophy } from 'lucide-react';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const phoneParam = searchParams.get('phone');
    if (phoneParam) {
      const cleanPhone = phoneParam.replace(/^\+91/, '');
      setPhone(cleanPhone);
    }
  }, [searchParams]);

  // Format phone number - only allow 10 digits
  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits.slice(0, 10);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (phone.length !== 10) {
        setError('Please enter a valid 10-digit phone number');
        setIsLoading(false);
        return;
      }

      const formattedPhone = `+91${phone}`;
      
      // Check if user exists and login directly
      const response = await fetch(`/api/users?phone=${encodeURIComponent(formattedPhone)}`);
      const data = await response.json();
      
      if (data.success && data.user) {
        // Login successful
        login(data.user);
        router.push('/dashboard');
      } else {
        // User doesn't exist - redirect to register
        router.push(`/register?phone=${encodeURIComponent(formattedPhone)}`);
      }
    } catch (err: any) {
      console.error('Error logging in:', err);
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10" padding="lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-primary rounded-xl w-fit">
            <Trophy className="w-10 h-10 text-accent" />
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <p className="text-text-secondary mt-2">Sign in with your phone number</p>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                type="tel"
                label="Phone Number"
                placeholder="9876543210"
                value={phone}
                onChange={handlePhoneChange}
                icon={<Phone size={18} />}
                maxLength={10}
                required
              />
              <p className="text-xs text-text-secondary mt-2">
                Enter your 10-digit mobile number (without +91)
              </p>
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              isLoading={isLoading}
              disabled={phone.length !== 10}
            >
              Sign In
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary">
            Don&apos;t have an account?{' '}
            <a href="/register" className="text-accent hover:underline">
              Sign up
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginForm() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="text-text-secondary">Loading...</div></div>}>
      <LoginFormContent />
    </Suspense>
  );
}