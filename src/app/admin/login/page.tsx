'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Leaf, Lock, ArrowRight, AlertCircle } from 'lucide-react';

// Klinkers & Co Design System - Orange/Blue
const colors = {
  orange: '#FA5D29',
  orangeLight: '#FFF4F1',
  blue: '#49B3FC',
  blueLight: '#F0F9FF',
  dark: '#222222',
  darkLight: '#2d2d2d',
  slate: '#64748b',
  stone: '#F8F8F8',
  warmWhite: '#ffffff',
  mist: '#ededed',
};

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('admin_token', data.token);
        router.push('/admin');
      } else {
        setError('Onjuist wachtwoord');
      }
    } catch {
      setError('Er ging iets mis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4" style={{ backgroundColor: colors.dark }}>
      {/* Subtle background gradients */}
      <div className="absolute inset-0">
        <div
          className="absolute top-20 left-20 w-72 h-72 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: colors.orange }}
        />
        <div
          className="absolute bottom-20 right-20 w-96 h-96 rounded-full blur-3xl opacity-15"
          style={{ backgroundColor: colors.blue }}
        />
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md">
        {/* Subtle glow */}
        <div
          className="absolute -inset-1 rounded-2xl blur opacity-20"
          style={{ backgroundColor: colors.orange }}
        />

        <Card className="relative border-0 shadow-2xl bg-white rounded-xl overflow-hidden">
          {/* Top accent */}
          <div className="h-1" style={{ backgroundColor: colors.orange }} />

          <CardContent className="p-8 pt-10">
            {/* Logo and header */}
            <div className="text-center mb-8">
              <div className="relative w-16 h-16 mx-auto mb-6">
                <div
                  className="relative w-16 h-16 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: colors.orange }}
                >
                  <Leaf className="w-8 h-8 text-white" />
                </div>
              </div>

              <h1 className="text-2xl font-semibold mb-2" style={{ color: colors.dark }}>
                Klinkers & Co
              </h1>
              <p style={{ color: colors.slate }}>
                Log in om toegang te krijgen tot het admin dashboard
              </p>
            </div>

            {/* Login form */}
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label
                  className="text-sm font-medium mb-2 block"
                  style={{ color: colors.dark }}
                >
                  Wachtwoord
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Lock className="w-5 h-5" style={{ color: colors.slate }} />
                  </div>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Voer wachtwoord in"
                    required
                    autoFocus
                    className="h-12 pl-12 pr-4 text-base rounded-lg"
                    style={{
                      backgroundColor: colors.stone,
                      borderColor: colors.mist,
                    }}
                  />
                </div>
              </div>

              {error && (
                <div
                  className="flex items-center gap-2 rounded-lg px-4 py-3"
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#ef4444'
                  }}
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base font-medium transition-all rounded-lg"
                style={{ backgroundColor: colors.orange, color: 'white' }}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Inloggen...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Inloggen
                    <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </Button>
            </form>

            {/* Footer */}
            <div
              className="mt-8 pt-6 text-center text-sm"
              style={{ borderTop: `1px solid ${colors.mist}`, color: colors.slate }}
            >
              © {new Date().getFullYear()} Klinkers & Co
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
