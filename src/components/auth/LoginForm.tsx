'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { User as UserIcon, Trophy, KeyRound } from 'lucide-react';

function LoginFormContent() {
  const searchParams = useSearchParams();
  const { login, isAuthenticated } = useAuth();
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'MAIN' | 'OTP' | 'FORGOT_PASS' | 'FORGOT_RESET'>('MAIN');
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setIdentifier(emailParam);
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

  const handleSendOtpCore = async (mode: 'login' | 'forgot') => {
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (!identifier) {
        setError('Please enter a valid Email or Username');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier }),
      });
      const data = await response.json();
      
      if (data.success) {
        setStep(mode === 'login' ? 'OTP' : 'FORGOT_RESET');
        setSuccessMsg(mode === 'login' ? 'OTP sent successfully!!!' : 'OTP sent successfully! Check your email.');
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

  const handleLoginWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (!identifier) {
        setError('Please enter your Registered Email-ID');
        setIsLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Please enter your password (min 6 chars)');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier, password }),
      });
      const data = await response.json();
      
      if (data.success && data.token) {
        await login(data.user, data.token);
        window.location.href = '/dashboard';
      } else if (data.error === 'User not found') {
        window.location.href = `/register?email=${encodeURIComponent(identifier.toLowerCase())}`;
      } else {
        setError(data.error || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      console.error('Error logging in:', err);
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
        body: JSON.stringify({ email: identifier, otp }),
      });
      const data = await response.json();
      
      if (data.success && data.token) {
        await login(data.user, data.token);
        window.location.href = '/dashboard';
      } else {
        setError(data.error || 'Login failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Error verifying OTP:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
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
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setIsLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, otp, password }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessMsg('Password reset successful! You can now sign in.');
        setPassword('');
        setConfirmPassword('');
        setOtp('');
        setStep('MAIN');
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err: any) {
      console.error('Error resetting password:', err);
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
          <CardTitle className="text-2xl">
            {step === 'FORGOT_PASS' || step === 'FORGOT_RESET' ? 'Reset Password' : 'Welcome Back'}
          </CardTitle>
          <p className="text-text-secondary mt-2">
             {step === 'FORGOT_PASS' || step === 'FORGOT_RESET' ? 'Recover your account' : 'Sign in to your account'}
          </p>
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

          {step === 'MAIN' ? (
            <form onSubmit={handleLoginWithPassword} className="space-y-4">
              <div>
                <Input
                  type="text"
                  label="Email or Username"
                  placeholder="name@example.com or user123"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  icon={<UserIcon size={18} />}
                  required
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-medium text-text-secondary">Password</span>
                  <button 
                    type="button" 
                    onClick={() => { setStep('FORGOT_PASS'); setSuccessMsg(''); setError(''); }}
                    className="text-xs text-accent hover:underline focus:outline-none"
                  >
                    Forgot Password?
                  </button>
                </div>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<KeyRound size={18} />}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                isLoading={isLoading}
                disabled={!identifier || password.length < 6}
              >
                Sign In
              </Button>
              
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-text-secondary">Or log in with OTP</span>
                </div>
              </div>

              <Button 
                type="button" 
                variant="secondary"
                className="w-full" 
                onClick={(e) => { e.preventDefault(); handleSendOtpCore('login'); }}
                isLoading={isLoading}
                disabled={!identifier}
              >
                Send OTP
              </Button>
            </form>
          ) : step === 'OTP' ? (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-text-primary">OTP Verification</span>
                  <button 
                    type="button" 
                    onClick={() => { setStep('MAIN'); setOtp(''); setPassword(''); setSuccessMsg(''); setError(''); }}
                    className="text-xs text-accent hover:underline focus:outline-none"
                  >
                    Back to Login
                  </button>
                </div>
                <Input
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(formatOtp(e.target.value))}
                  icon={<KeyRound size={18} />}
                  maxLength={6}
                  required
                />
                <p className="text-xs text-text-secondary mt-2">
                  Enter the 6-digit code sent to {identifier}
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
          ) : step === 'FORGOT_PASS' ? (
             <form onSubmit={(e) => { e.preventDefault(); handleSendOtpCore('forgot'); }} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-text-primary">Find Your Account</span>
                    <button 
                      type="button" 
                      onClick={() => { setStep('MAIN'); setSuccessMsg(''); setError(''); }}
                      className="text-xs text-accent hover:underline focus:outline-none"
                    >
                      Back to Login
                    </button>
                  </div>
                  <Input
                    type="text"
                    placeholder="Enter your registered Email or Username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    icon={<UserIcon size={18} />}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  isLoading={isLoading}
                  disabled={!identifier}
                >
                  Send Reset OTP
                </Button>
             </form>
          ) : (
             <form onSubmit={handleResetPassword} className="space-y-4">
               <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-text-primary">Reset Verification</span>
                    <button 
                      type="button" 
                      onClick={() => { setStep('FORGOT_PASS'); setOtp(''); setSuccessMsg(''); setError(''); }}
                      className="text-xs text-accent hover:underline focus:outline-none"
                    >
                      Change Account
                    </button>
                  </div>
                  <Input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(formatOtp(e.target.value))}
                    icon={<KeyRound size={18} />}
                    maxLength={6}
                    required
                  />
               </div>
               <Input
                  type="password"
                  label="New Password"
                  placeholder="Create a new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<KeyRound size={18} />}
                  required
               />
               <Input
                  type="password"
                  label="Confirm New Password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  icon={<KeyRound size={18} />}
                  required
               />
               <Button 
                  type="submit" 
                  className="w-full" 
                  isLoading={isLoading}
                  disabled={otp.length !== 6 || password.length < 6 || password !== confirmPassword}
                >
                  Reset Password
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
