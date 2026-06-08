'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Lock, ArrowRight, AlertCircle, PlayCircle } from 'lucide-react';

export default function DemoLogin() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/demo/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('demo_token', data.token);
        router.push('/demo');
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
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Background */}
      <div className="absolute inset-0 hero-gradient" />

      {/* Animated elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '-2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-3xl animate-pulse-glow" />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 pattern-grid opacity-20" />

      {/* Login Card */}
      <div className="relative w-full max-w-md">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl blur opacity-30" />

        <Card className="relative border-0 shadow-2xl bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden">
          {/* Top gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500" />

          <CardContent className="p-8 pt-10">
            {/* Logo and header */}
            <div className="text-center mb-8">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl blur opacity-50" />
                <div className="relative w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-slate-800">
                  Klinkers & Co
                </h1>
                <span className="text-xs bg-orange-500/20 border border-orange-400/50 text-orange-600 px-2 py-0.5 rounded-full font-medium animate-pulse">
                  DEMO
                </span>
              </div>
              <p className="text-slate-500">
                Log in om de demo omgeving te bekijken
              </p>
            </div>

            {/* Demo info banner */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-3 mb-6">
              <div className="flex items-center gap-2 text-orange-700">
                <Sparkles className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium">Dit is een demo met nep-data</span>
              </div>
            </div>

            {/* Login form */}
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Wachtwoord
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Lock className="w-5 h-5 text-slate-400" />
                  </div>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Voer wachtwoord in"
                    required
                    autoFocus
                    className="h-14 pl-12 pr-4 text-lg bg-slate-50 border-slate-200 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-14 text-lg btn-shine bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all rounded-xl"
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
                    Demo Starten
                    <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-400">
                Demo omgeving voor video opnames
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
