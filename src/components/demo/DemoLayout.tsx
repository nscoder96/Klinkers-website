'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useDemoAuth } from '@/lib/useDemoAuth';
import {
  LayoutDashboard,
  Users,
  FileText,
  Euro,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Settings
} from 'lucide-react';
import { useState } from 'react';

interface DemoLayoutProps {
  children: React.ReactNode;
}

export default function DemoLayout({ children }: DemoLayoutProps) {
  const pathname = usePathname();
  const { logout } = useDemoAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const navItems = [
    { href: '/demo', label: 'Dashboard', icon: LayoutDashboard, gradient: 'from-blue-500 to-cyan-500' },
    { href: '/demo/leads', label: 'Leads', icon: Users, gradient: 'from-green-500 to-emerald-500' },
    { href: '/demo/offertes', label: 'Offertes', icon: FileText, gradient: 'from-orange-500 to-amber-500' },
    { href: '/demo/prijzen', label: 'Prijzen', icon: Euro, gradient: 'from-yellow-500 to-orange-500' },
    { href: '/demo/instellingen/categorieen', label: 'Instellingen', icon: Settings, gradient: 'from-slate-500 to-slate-600' },
  ];

  const isActive = (href: string) => {
    if (href === '/demo') {
      return pathname === '/demo';
    }
    return pathname.startsWith(href);
  };

  const resetDemoData = async () => {
    setResetting(true);
    try {
      const response = await fetch('/api/demo/seed', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        window.location.reload();
      } else {
        alert('Fout bij resetten demo data');
      }
    } catch (error) {
      console.error('Reset error:', error);
      alert('Fout bij resetten demo data');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white sticky top-0 z-50 shadow-2xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <Link href="/demo" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg blur opacity-30 group-hover:opacity-50 transition-opacity" />
                <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-2">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight">Klinkers & Co</span>
                <span className="text-xs bg-orange-500/30 border border-orange-400/50 px-2 py-0.5 rounded-full font-medium">
                  DEMO
                </span>
              </div>
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Desktop actions */}
            <div className="hidden lg:flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetDemoData}
                disabled={resetting}
                className="text-white/70 hover:text-white hover:bg-white/10 items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${resetting ? 'animate-spin' : ''}`} />
                {resetting ? 'Resetten...' : 'Reset Data'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-white/70 hover:text-white hover:bg-white/10 items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Uitloggen
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Demo Mode Banner */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 text-white text-center py-1.5 text-sm font-medium">
        <span className="flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          Demo-omgeving met voorbeelddata
          <Sparkles className="w-3.5 h-3.5" />
        </span>
      </div>

      {/* Navigation */}
      <nav className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 border-b border-slate-600/50 shadow-lg">
        <div className="container mx-auto px-4">
          {/* Desktop Navigation */}
          <div className="hidden lg:flex gap-2 py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 group ${
                    active
                      ? 'text-white shadow-lg'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {active && (
                    <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} rounded-xl opacity-90`} />
                  )}

                  <span className={`relative flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                    active
                      ? 'bg-white/20'
                      : 'bg-white/5 group-hover:bg-white/10'
                  }`}>
                    <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                  </span>
                  <span className="relative">{item.label}</span>

                  {!active && (
                    <ChevronRight className="relative w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0 transition-all" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Mobile Navigation */}
          <div className={`lg:hidden overflow-hidden transition-all duration-300 ${mobileMenuOpen ? 'max-h-96 py-4' : 'max-h-0'}`}>
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? 'text-white'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {active && (
                      <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} rounded-xl opacity-90`} />
                    )}
                    <span className={`relative flex items-center justify-center w-10 h-10 rounded-lg ${
                      active ? 'bg-white/20' : 'bg-white/10'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className="relative flex-1">{item.label}</span>
                    <ChevronRight className={`relative w-5 h-5 transition-transform ${active ? 'translate-x-1' : ''}`} />
                  </Link>
                );
              })}

              {/* Mobile reset and logout */}
              <button
                onClick={resetDemoData}
                disabled={resetting}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all"
              >
                <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/10">
                  <RefreshCw className={`w-5 h-5 ${resetting ? 'animate-spin' : ''}`} />
                </span>
                <span>{resetting ? 'Resetten...' : 'Reset Demo Data'}</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
              >
                <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-500/10">
                  <LogOut className="w-5 h-5" />
                </span>
                <span>Uitloggen</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="animate-fade-in">
          {children}
        </div>
      </main>

      {/* Footer accent */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-green-500 to-blue-500 opacity-50" />
    </div>
  );
}
