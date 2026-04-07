'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Mail, Trophy, KeyRound } from 'lucide-react';

function LoginFormContent() {
  const searchParams = useSearchParams();
  const { login, isAuthenticated } = useAuth();
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = '/dashboard';
    }
  }, [isAuthenticated]);

  const formatOtp = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits.slice(0, 6);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatOtp(e.target.value);
    setOtp(formatted);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (!email.includes('@')) {
        setError('Please enter a valid email address');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });
      const data = await response.json();
      
      if (data.success) {
        setStep('OTP');
        setSuccessMsg('OTP sent successfully!!!');
      } else {
        setError(data.error || 'Failed to send OTP.');
      }
    } catch (err: any) {
      console.error('Error sending OTP:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (otp.length !== 6) {
        setError('Please enter a valid 6-digit OTP');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), otp }),
      });
      const data = await response.json();
      console.log('Login response:', data);
      
      if (data.success && data.token) {
        await login(data.user, data.token);
        console.log('Login successful, token received:', data.token);
        window.location.href = '/dashboard';
      } else if (data.error === 'User not found') {
        window.location.href = `/register?email=${encodeURIComponent(email.toLowerCase())}`;
      } else {
        setError(data.error || 'Login failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Error logging in:', err);
      setError('Something went wrong. Please try again.');
    } finally {
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
          <p className="text-text-secondary mt-2">Sign in with your email</p>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-danger-bg/45 border border-danger-border rounded-lg text-danger-text text-sm">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-success-bg/45 border border-success-border rounded-lg text-success-text text-sm">
              {successMsg}
            </div>
          )}

          {step === 'EMAIL' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <Input
                  type="email"
                  label="Email Address"
                  placeholder="you@example.com"
                  value={email}
                  onChange={handleEmailChange}
                  icon={<Mail size={18} />}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                isLoading={isLoading}
                disabled={!email.includes('@')}
              >
                Send OTP
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-text-primary">OTP Verification</span>
                  <button 
                    type="button" 
                    onClick={() => { setStep('EMAIL'); setOtp(''); setSuccessMsg(''); setError(''); }}
                    className="text-xs text-accent hover:underline"
                  >
                    Change Email
                  </button>
                </div>
                <Input
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={handleOtpChange}
                  icon={<KeyRound size={18} />}
                  maxLength={6}
                  required
                />
                <p className="text-xs text-text-secondary mt-2">
                  Enter the 6-digit code sent to {email}
                </p>
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                isLoading={isLoading}
                disabled={otp.length !== 6}
              >
                Verify & Sign In
              </Button>
            </form>
          )}

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
