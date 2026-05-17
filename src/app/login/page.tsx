'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useMutation } from '@tanstack/react-query';
import { API_BASE_URL } from '@/config/api';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/clubs';
  const tokenFromUrl = searchParams.get('token');
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    if (tokenFromUrl) {
      login(tokenFromUrl);
      router.push(returnUrl);
    }
  }, [tokenFromUrl, login, router, returnUrl]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'initial' | 'password'>('initial');

  // useEffect(() => {
  //   // If pendingBooking exists and user is logged in, redirect back
  //   const token = localStorage.getItem('token');
  //   if (token) {
  //     router.push(returnUrl);
  //   }
  // }, [router, returnUrl]);

  const handleGoogleSignIn = () => {
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setStep('password');
    }
  };

  const [error, setError] = useState('');

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Login failed');
      }
      return data.data;
    },
    onSuccess: (data) => {
      login(data.token, data.user);
      router.push(returnUrl);
    },
    onError: (err: any) => {
      setError(err.message || 'An error occurred. Please try again.');
    }
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate();
  };

  const handleSkipPassword = () => {
    // We remove the skip password for now since we need a real token, or you can implement passwordless login.
    setError('Password is required for login.');
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-snookerGreen to-goldAccent">
          Sign in to Cue King
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Or{' '}
          <Link href={`/signup?returnUrl=${encodeURIComponent(returnUrl)}`} className="font-medium text-snookerGreen hover:text-snookerGreen/80">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/5 border border-white/10 py-8 px-4 shadow sm:rounded-lg sm:px-10 backdrop-blur-sm">

          {step === 'initial' ? (
            <>
              <form className="space-y-6" onSubmit={handleEmailSubmit}>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                    Email address
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-white/10 rounded-md shadow-sm placeholder-gray-400 bg-black/50 focus:outline-none focus:ring-snookerGreen focus:border-snookerGreen sm:text-sm text-white"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-goldAccent hover:bg-goldAccent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-goldAccent focus:ring-offset-black"
                  >
                    Continue with Email
                  </button>
                </div>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-black text-gray-400">Or continue with</span>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={handleGoogleSignIn}
                    className="w-full flex justify-center py-2 px-4 border border-white/20 rounded-md shadow-sm text-sm font-medium text-white bg-transparent hover:bg-white/5 focus:outline-none"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Google
                  </button>
                </div>
              </div>
            </>
          ) : (
            <form className="space-y-6" onSubmit={handlePasswordSubmit}>
              {error && (
                <div className="p-3 rounded-md bg-red-500/10 border border-red-500/50 text-red-500 text-sm">
                  {error}
                </div>
              )}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-white/10 rounded-md shadow-sm placeholder-gray-400 bg-black/50 focus:outline-none focus:ring-snookerGreen focus:border-snookerGreen sm:text-sm text-white"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-snookerGreen hover:bg-snookerGreen/90 focus:outline-none disabled:opacity-50"
                >
                  {loginMutation.isPending ? 'Signing in...' : 'Sign in with Password'}
                </button>
                <button
                  type="button"
                  onClick={handleSkipPassword}
                  className="w-full flex justify-center py-2 px-4 border border-white/20 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-transparent hover:bg-white/5 focus:outline-none"
                >
                  Skip for now
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
