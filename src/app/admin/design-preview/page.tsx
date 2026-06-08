'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Leaf,
  Users,
  FileText,
  TrendingUp,
  Plus,
  Search,
  Bell,
  Settings,
  Home,
  ChevronRight,
  Check,
  X,
  Edit,
  Download,
  Mail,
  Send,
  ArrowRight,
  Calendar,
  Euro
} from 'lucide-react';
import Link from 'next/link';

// NEW: Klinkers & Co Design System - Orange Primary + Blue Accent
const colors = {
  // Primary - Herkenbaar Oranje
  orange: '#f97316',
  orangeHover: '#ea580c',
  orangeLight: '#fff7ed',
  orangeBorder: '#fed7aa',

  // Accent - Professioneel Blauw
  blue: '#3b82f6',
  blueHover: '#2563eb',
  blueLight: '#eff6ff',
  blueBorder: '#bfdbfe',

  // Neutrals - Clean & Professional
  anthracite: '#1e293b',
  anthraciteLight: '#334155',
  slate: '#64748b',
  gray: '#94a3b8',

  // Backgrounds
  stone: '#f8fafc',
  warmWhite: '#ffffff',
  mist: '#e2e8f0',

  // Semantic
  success: '#22c55e',
  successLight: '#f0fdf4',
  warning: '#f59e0b',
  warningLight: '#fffbeb',
  error: '#ef4444',
  errorLight: '#fef2f2',
};

export default function DesignPreviewPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.stone }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          backgroundColor: colors.warmWhite,
          borderColor: colors.mist
        }}
      >
        <div className="flex items-center justify-between px-6 py-3">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: colors.orange }}
            >
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg" style={{ color: colors.anthracite }}>
                Klinkers & Co
              </h1>
              <p className="text-xs" style={{ color: colors.slate }}>Hovenierssoftware</p>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.gray }} />
              <Input
                placeholder="Zoeken..."
                className="pl-10 h-9"
                style={{
                  backgroundColor: colors.stone,
                  borderColor: colors.mist
                }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              className="relative p-2 rounded-lg transition-colors hover:bg-gray-100"
            >
              <Bell className="w-5 h-5" style={{ color: colors.slate }} />
              <span
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center text-white"
                style={{ backgroundColor: colors.orange }}
              >
                3
              </span>
            </button>
            <button className="p-2 rounded-lg transition-colors hover:bg-gray-100">
              <Settings className="w-5 h-5" style={{ color: colors.slate }} />
            </button>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-medium text-white"
              style={{ backgroundColor: colors.blue }}
            >
              NK
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className="w-64 min-h-[calc(100vh-57px)] border-r p-4"
          style={{
            backgroundColor: colors.warmWhite,
            borderColor: colors.mist
          }}
        >
          <nav className="space-y-1">
            {[
              { icon: Home, label: 'Dashboard', active: true },
              { icon: Users, label: 'Leads', badge: 5 },
              { icon: FileText, label: 'Offertes', badge: 2 },
              { icon: Users, label: 'Klanten' },
              { icon: Calendar, label: 'Planning' },
              { icon: Euro, label: 'Prijzen' },
              { icon: Settings, label: 'Instellingen' },
            ].map((item) => (
              <button
                key={item.label}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all"
                style={{
                  backgroundColor: item.active ? colors.orangeLight : 'transparent',
                  color: item.active ? colors.orange : colors.anthracite,
                  borderLeft: item.active ? `3px solid ${colors.orange}` : '3px solid transparent',
                }}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: colors.blue }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Quick Action */}
          <div className="mt-8">
            <Button
              className="w-full justify-center gap-2"
              style={{ backgroundColor: colors.orange, color: 'white' }}
            >
              <Plus className="w-4 h-4" />
              Nieuwe Offerte
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-6" style={{ color: colors.slate }}>
            <span>Admin</span>
            <ChevronRight className="w-4 h-4" />
            <span style={{ color: colors.anthracite }}>Dashboard</span>
          </div>

          {/* Page Title */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: colors.anthracite }}>
                Dashboard
              </h1>
              <p style={{ color: colors.slate }}>Overzicht van je bedrijf</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" style={{ borderColor: colors.mist }}>
                <Download className="w-4 h-4 mr-2" />
                Exporteer
              </Button>
              <Button style={{ backgroundColor: colors.blue, color: 'white' }}>
                <Plus className="w-4 h-4 mr-2" />
                Nieuwe Lead
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Leads deze maand', value: '24', change: '+12%', color: colors.orange },
              { label: 'Openstaande offertes', value: '8', change: '€45.200', color: colors.blue },
              { label: 'Conversieratio', value: '68%', change: '+5%', color: colors.success },
              { label: 'Omzet dit kwartaal', value: '€125K', change: '+18%', color: colors.anthracite },
            ].map((stat) => (
              <Card key={stat.label} className="border-0 shadow-sm" style={{ backgroundColor: colors.warmWhite }}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm" style={{ color: colors.slate }}>{stat.label}</span>
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${stat.color}15` }}
                    >
                      <TrendingUp className="w-4 h-4" style={{ color: stat.color }} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: colors.anthracite }}>{stat.value}</p>
                  <p className="text-sm mt-1" style={{ color: colors.success }}>{stat.change}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Button Examples */}
          <Card className="border-0 shadow-sm mb-6" style={{ backgroundColor: colors.warmWhite }}>
            <CardHeader>
              <CardTitle style={{ color: colors.anthracite }}>Button Styles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {/* Primary Orange */}
                <Button style={{ backgroundColor: colors.orange, color: 'white' }}>
                  <Edit className="w-4 h-4 mr-2" />
                  Bewerken
                </Button>

                {/* Outline */}
                <Button variant="outline" style={{ borderColor: colors.mist, color: colors.anthracite }}>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>

                {/* Outline */}
                <Button variant="outline" style={{ borderColor: colors.mist, color: colors.anthracite }}>
                  <Mail className="w-4 h-4 mr-2" />
                  Verstuur per email
                </Button>

                {/* Accent Blue */}
                <Button style={{ backgroundColor: colors.blue, color: 'white' }}>
                  <Send className="w-4 h-4 mr-2" />
                  Verstuur offerte
                </Button>

                {/* Success */}
                <Button style={{ backgroundColor: colors.success, color: 'white' }}>
                  <Check className="w-4 h-4 mr-2" />
                  Akkoord
                </Button>

                {/* Danger Outline */}
                <Button variant="outline" style={{ borderColor: colors.error, color: colors.error }}>
                  <X className="w-4 h-4 mr-2" />
                  Afwijzen
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Leads */}
          <Card className="border-0 shadow-sm" style={{ backgroundColor: colors.warmWhite }}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle style={{ color: colors.anthracite }}>Recente Leads</CardTitle>
              <Button variant="ghost" className="gap-1" style={{ color: colors.orange }}>
                Bekijk alle <ArrowRight className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Jan de Vries', city: 'Amsterdam', status: 'Nieuw', statusColor: colors.orange },
                  { name: 'Petra Jansen', city: 'Utrecht', status: 'Offerte verstuurd', statusColor: colors.blue },
                  { name: 'Klaas Bakker', city: 'Rotterdam', status: 'Gewonnen', statusColor: colors.success },
                ].map((lead, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-lg transition-colors hover:bg-gray-50"
                    style={{ backgroundColor: colors.stone }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-medium text-white"
                        style={{ backgroundColor: colors.blue }}
                      >
                        {lead.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: colors.anthracite }}>{lead.name}</p>
                        <p className="text-sm" style={{ color: colors.slate }}>{lead.city}</p>
                      </div>
                    </div>
                    <span
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: `${lead.statusColor}15`,
                        color: lead.statusColor
                      }}
                    >
                      {lead.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Back to admin link */}
          <div className="mt-8 text-center">
            <Link href="/admin" className="text-sm hover:underline" style={{ color: colors.blue }}>
              ← Terug naar huidige admin
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
