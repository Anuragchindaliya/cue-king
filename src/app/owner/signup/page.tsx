'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { API_BASE_URL } from '@/config/api';

export default function OwnerSignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const ownerSignupMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: 'CLUB_OWNER' }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Registration failed');
      }
      return data.data;
    },
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      router.push('/owner/dashboard');
    },
    onError: (err: any) => {
      setError(err.message || 'Something went wrong. Please try again.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    ownerSignupMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-sm">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-snookerGreen to-goldAccent">
            Partner with Cue King
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Register your club and start accepting bookings
          </p>
        </div>
        
        {error && <div className="text-red-500 text-sm text-center bg-red-500/10 p-3 rounded-lg">{error}</div>}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300">Full Name</label>
              <input
                name="name"
                type="text"
                required
                className="mt-1 appearance-none block w-full px-3 py-2 border border-white/10 rounded-md shadow-sm placeholder-gray-400 bg-black/50 focus:outline-none focus:ring-snookerGreen focus:border-snookerGreen sm:text-sm text-white"
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Email address</label>
              <input
                name="email"
                type="email"
                required
                className="mt-1 appearance-none block w-full px-3 py-2 border border-white/10 rounded-md shadow-sm placeholder-gray-400 bg-black/50 focus:outline-none focus:ring-snookerGreen focus:border-snookerGreen sm:text-sm text-white"
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Password</label>
              <input
                name="password"
                type="password"
                required
                className="mt-1 appearance-none block w-full px-3 py-2 border border-white/10 rounded-md shadow-sm placeholder-gray-400 bg-black/50 focus:outline-none focus:ring-snookerGreen focus:border-snookerGreen sm:text-sm text-white"
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={ownerSignupMutation.isPending}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-goldAccent hover:bg-goldAccent/90 focus:outline-none"
            >
              {ownerSignupMutation.isPending ? 'Registering...' : 'Create Owner Account'}
            </button>
          </div>
        </form>
        
        <p className="text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link href="/login?returnUrl=/owner/dashboard" className="text-snookerGreen hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
