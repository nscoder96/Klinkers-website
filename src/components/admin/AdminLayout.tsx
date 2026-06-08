'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/lib/useAdminAuth';
import OnboardingModal, { useOnboarding } from './OnboardingModal';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  FileText,
  Calendar,
  Hammer,
  Euro,
  Receipt,
  LogOut,
  Menu,
  Settings,
  Leaf,
  Bell,
  Search,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { logout } = useAdminAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { showOnboarding, isLoading: onboardingLoading, completeOnboarding } = useOnboarding();

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/leads', label: 'Leads', icon: Users },
    { href: '/admin/klanten', label: 'Klanten', icon: UserCheck },
    { href: '/admin/offertes', label: 'Offertes', icon: FileText },
    { href: '/admin/facturen', label: 'Facturen', icon: Receipt },
    { href: '/admin/planning', label: 'Planning', icon: Calendar },
    { href: '/admin/projecten', label: 'Projecten', icon: Hammer },
    { href: '/admin/prijzen', label: 'Prijzen', icon: Euro },
    { href: '/admin/instellingen', label: 'Instellingen', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="h-screen bg-[#F3F4F6] flex font-sans overflow-hidden">

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 bottom-0 z-50 w-64 bg-[#0F172A] text-white transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:block
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="h-full flex flex-col">
          {/* Logo Area */}
          <div className="h-16 flex items-center px-6 border-b border-white/10">
            <Link href="/admin" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center transition-transform group-hover:scale-105">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">TuinPro</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Menu</p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative
                    ${active
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                  <span>{item.label}</span>
                  {active && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
                </Link>
              );
            })}
          </nav>

          {/* User Profile / Logout */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                NK
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">Niek Klinkers</p>
                <p className="text-xs text-slate-400 truncate">Klinkers & Co</p>
              </div>
              <Button
                onClick={logout}
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-white hover:bg-transparent"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-md"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search */}
            <div className="hidden md:flex items-center relative max-w-md">
              <Search className="w-4 h-4 absolute left-3 text-slate-400" />
              <Input
                type="text"
                placeholder="Zoeken..."
                className="pl-9 h-9 w-64 border-slate-200 bg-slate-50 focus:bg-white transition-colors rounded-full text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-6 w-px bg-slate-200"></div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700 hidden sm:block">Klinkers & Co</span>
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold ring-2 ring-white shadow-sm">
                KC
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {!onboardingLoading && (
        <OnboardingModal
          isOpen={showOnboarding}
          onComplete={completeOnboarding}
        />
      )}
    </div>
  );
}
