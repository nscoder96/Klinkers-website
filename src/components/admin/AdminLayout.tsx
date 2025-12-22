'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/lib/useAdminAuth';
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  Hammer,
  Euro,
  LogOut
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { logout } = useAdminAuth();

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/leads', label: 'Leads', icon: Users },
    { href: '/admin/offertes', label: 'Offertes', icon: FileText },
    { href: '/admin/planning', label: 'Planning', icon: Calendar },
    { href: '/admin/projecten', label: 'Projecten', icon: Hammer },
    { href: '/admin/prijzen', label: 'Prijzen', icon: Euro },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-slate-800 text-white sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <Link href="/admin" className="flex items-center gap-2">
              <span className="text-xl font-bold">Klinkers & Co</span>
              <span className="text-xs bg-orange-500 px-2 py-0.5 rounded">Admin</span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-gray-300 hover:text-white hover:bg-slate-700 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Uitloggen
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-slate-700 border-b border-slate-600">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive(item.href)
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-300 hover:bg-slate-600 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
