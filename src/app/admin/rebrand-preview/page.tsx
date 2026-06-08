'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  Settings,
  TrendingUp,
  TrendingDown,
  Euro,
  Clock,
  ChevronRight,
  Search,
  Bell,
  Plus,
  MoreHorizontal,
  Check,
  AlertCircle,
  ArrowUpRight,
  Leaf
} from 'lucide-react';

// ============================================
// DESIGN TOKENS - Klinkers & Co Rebrand
// ============================================
const colors = {
  anthracite: '#1a1f2e',
  anthraciteLight: '#2a3142',
  forest: '#2d5a47',
  moss: '#4a7c59',
  stone: '#f5f3ef',
  warmWhite: '#fafaf8',
  mist: '#e8e6e1',
  slate: '#64748b',
  terra: '#a16c46',
  warning: '#d97706',
  error: '#b91c1c',
};

// ============================================
// REUSABLE COMPONENTS
// ============================================

function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  [key: string]: unknown;
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variants = {
    primary: `bg-[${colors.anthracite}] text-white hover:bg-[${colors.anthraciteLight}] focus:ring-[${colors.anthracite}]`,
    secondary: `bg-transparent border-[1.5px] border-[${colors.mist}] text-[${colors.anthracite}] hover:bg-[${colors.stone}]`,
    accent: `bg-[${colors.forest}] text-white hover:bg-[${colors.moss}] focus:ring-[${colors.forest}]`,
    ghost: `bg-transparent text-[${colors.slate}] hover:bg-[${colors.stone}] hover:text-[${colors.anthracite}]`,
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      style={{
        backgroundColor: variant === 'primary' ? colors.anthracite : variant === 'accent' ? colors.forest : undefined,
        borderColor: variant === 'secondary' ? colors.mist : undefined,
        color: variant === 'primary' || variant === 'accent' ? 'white' : variant === 'secondary' ? colors.anthracite : colors.slate,
      }}
      {...props}
    >
      {children}
    </button>
  );
}

function Card({
  children,
  className = '',
  padding = 'md',
}: {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}) {
  const paddings = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`rounded-lg ${paddings[padding]} ${className}`}
      style={{
        backgroundColor: colors.warmWhite,
        border: `1px solid ${colors.mist}`,
      }}
    >
      {children}
    </div>
  );
}

function StatCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
}: {
  title: string;
  value: string;
  change: string;
  changeType: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: colors.slate }}>
            {title}
          </p>
          <p className="text-2xl font-semibold mt-1" style={{ color: colors.anthracite }}>
            {value}
          </p>
          <div className="flex items-center mt-2 text-sm">
            {changeType === 'up' && <TrendingUp className="w-4 h-4 mr-1" style={{ color: colors.forest }} />}
            {changeType === 'down' && <TrendingDown className="w-4 h-4 mr-1" style={{ color: colors.error }} />}
            <span style={{ color: changeType === 'up' ? colors.forest : changeType === 'down' ? colors.error : colors.slate }}>
              {change}
            </span>
            <span className="ml-1" style={{ color: colors.slate }}>vs vorige maand</span>
          </div>
        </div>
        <div
          className="p-3 rounded-lg"
          style={{ backgroundColor: colors.stone }}
        >
          <Icon className="w-5 h-5" style={{ color: colors.forest }} />
        </div>
      </div>
    </Card>
  );
}

function Badge({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
}) {
  const styles = {
    default: { bg: colors.stone, color: colors.anthracite },
    success: { bg: `${colors.forest}15`, color: colors.forest },
    warning: { bg: `${colors.warning}15`, color: colors.warning },
    error: { bg: `${colors.error}15`, color: colors.error },
  };

  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: styles[variant].bg, color: styles[variant].color }}
    >
      {children}
    </span>
  );
}

// ============================================
// NAVIGATION COMPONENT
// ============================================

function Sidebar() {
  const [activeItem, setActiveItem] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'offertes', label: 'Offertes', icon: FileText },
    { id: 'planning', label: 'Planning', icon: Calendar },
    { id: 'instellingen', label: 'Instellingen', icon: Settings },
  ];

  return (
    <aside
      className="w-60 min-h-screen flex flex-col"
      style={{ backgroundColor: colors.anthracite }}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: colors.forest }}
          >
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-semibold text-lg">Klinkers & Co</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => {
            const isActive = activeItem === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveItem(item.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150"
                  style={{
                    backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: isActive ? 'white' : 'rgba(255,255,255,0.7)',
                    borderLeft: isActive ? `3px solid ${colors.forest}` : '3px solid transparent',
                  }}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white text-sm font-medium">NK</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">Niek Klinkers</p>
            <p className="text-white/50 text-xs truncate">Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function TopBar() {
  return (
    <header
      className="h-16 flex items-center justify-between px-6"
      style={{
        backgroundColor: 'white',
        borderBottom: `1px solid ${colors.mist}`,
      }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center text-sm">
        <span style={{ color: colors.slate }}>Admin</span>
        <ChevronRight className="w-4 h-4 mx-2" style={{ color: colors.mist }} />
        <span style={{ color: colors.anthracite }} className="font-medium">Dashboard</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.slate }} />
          <input
            type="text"
            placeholder="Zoeken..."
            className="pl-9 pr-4 py-2 text-sm rounded-md w-64 focus:outline-none focus:ring-2"
            style={{
              backgroundColor: colors.stone,
              border: `1px solid ${colors.mist}`,
              color: colors.anthracite,
            }}
          />
        </div>

        {/* Notifications */}
        <button
          className="relative p-2 rounded-md transition-colors"
          style={{ color: colors.slate }}
        >
          <Bell className="w-5 h-5" />
          <span
            className="absolute top-1 right-1 w-2 h-2 rounded-full"
            style={{ backgroundColor: colors.forest }}
          />
        </button>

        {/* New Quote */}
        <Button variant="accent" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Nieuwe Offerte
        </Button>
      </div>
    </header>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function RebrandPreview() {
  // Demo data
  const recentQuotes = [
    { id: 1, number: 'OFF-2026-003', client: 'Familie de Vries', amount: 4250, status: 'draft', date: '9 jan' },
    { id: 2, number: 'OFF-2026-002', client: 'J. Bakker', amount: 2345, status: 'sent', date: '8 jan' },
    { id: 3, number: 'OFF-2026-001', client: 'Van den Berg', amount: 8900, status: 'accepted', date: '7 jan' },
    { id: 4, number: 'OFF-2025-089', client: 'Pietersen BV', amount: 12500, status: 'accepted', date: '5 jan' },
    { id: 5, number: 'OFF-2025-088', client: 'De Groot', amount: 3200, status: 'declined', date: '3 jan' },
  ];

  const upcomingTasks = [
    { id: 1, title: 'Schouw bij Van den Berg', time: '09:00', type: 'schouw' },
    { id: 2, title: 'Offerte versturen - Jansen', time: '11:00', type: 'offerte' },
    { id: 3, title: 'Project start - Bakker tuin', time: '13:00', type: 'project' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge>Concept</Badge>;
      case 'sent':
        return <Badge variant="warning">Verstuurd</Badge>;
      case 'accepted':
        return <Badge variant="success">Geaccepteerd</Badge>;
      case 'declined':
        return <Badge variant="error">Afgewezen</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: colors.stone }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <TopBar />

        {/* Page Content */}
        <main className="flex-1 p-6">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold" style={{ color: colors.anthracite }}>
              Dashboard
            </h1>
            <p className="mt-1" style={{ color: colors.slate }}>
              Welkom terug, Niek. Hier is je overzicht van vandaag.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Openstaande offertes"
              value="12"
              change="+3"
              changeType="up"
              icon={FileText}
            />
            <StatCard
              title="Omzet deze maand"
              value="€24.580"
              change="+12%"
              changeType="up"
              icon={Euro}
            />
            <StatCard
              title="Conversieratio"
              value="68%"
              change="-2%"
              changeType="down"
              icon={TrendingUp}
            />
            <StatCard
              title="Gem. doorlooptijd"
              value="4.2 dagen"
              change="gelijk"
              changeType="neutral"
              icon={Clock}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Quotes - Takes 2 columns */}
            <div className="lg:col-span-2">
              <Card padding="sm">
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                  <h2 className="text-base font-semibold" style={{ color: colors.anthracite }}>
                    Recente Offertes
                  </h2>
                  <Link
                    href="/admin/offertes"
                    className="text-sm font-medium flex items-center"
                    style={{ color: colors.forest }}
                  >
                    Bekijk alle
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ backgroundColor: colors.stone }}>
                        <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3" style={{ color: colors.slate }}>
                          Offerte
                        </th>
                        <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3" style={{ color: colors.slate }}>
                          Klant
                        </th>
                        <th className="text-right text-xs font-medium uppercase tracking-wider px-4 py-3" style={{ color: colors.slate }}>
                          Bedrag
                        </th>
                        <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3" style={{ color: colors.slate }}>
                          Status
                        </th>
                        <th className="text-right text-xs font-medium uppercase tracking-wider px-4 py-3" style={{ color: colors.slate }}>
                          Datum
                        </th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: colors.mist }}>
                      {recentQuotes.map((quote, index) => (
                        <tr
                          key={quote.id}
                          className="hover:bg-white/50 transition-colors"
                          style={{ backgroundColor: index % 2 === 0 ? 'white' : colors.warmWhite }}
                        >
                          <td className="px-4 py-3">
                            <span className="font-medium text-sm" style={{ color: colors.anthracite }}>
                              {quote.number}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm" style={{ color: colors.anthracite }}>
                              {quote.client}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-medium text-sm" style={{ color: colors.anthracite }}>
                              €{quote.amount.toLocaleString('nl-NL')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {getStatusBadge(quote.status)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm" style={{ color: colors.slate }}>
                              {quote.date}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button className="p-1 rounded hover:bg-gray-100">
                              <MoreHorizontal className="w-4 h-4" style={{ color: colors.slate }} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Upcoming Tasks - Takes 1 column */}
            <div>
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold" style={{ color: colors.anthracite }}>
                    Vandaag
                  </h2>
                  <span className="text-sm" style={{ color: colors.slate }}>
                    9 januari 2026
                  </span>
                </div>

                <div className="space-y-3">
                  {upcomingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 p-3 rounded-lg"
                      style={{ backgroundColor: colors.stone }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: task.type === 'schouw' ? `${colors.forest}15` :
                            task.type === 'offerte' ? `${colors.warning}15` : `${colors.anthracite}15`,
                        }}
                      >
                        {task.type === 'schouw' && <Users className="w-5 h-5" style={{ color: colors.forest }} />}
                        {task.type === 'offerte' && <FileText className="w-5 h-5" style={{ color: colors.warning }} />}
                        {task.type === 'project' && <Check className="w-5 h-5" style={{ color: colors.anthracite }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: colors.anthracite }}>
                          {task.title}
                        </p>
                        <p className="text-xs" style={{ color: colors.slate }}>
                          {task.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  className="w-full mt-4 py-2.5 text-sm font-medium rounded-md transition-colors"
                  style={{
                    backgroundColor: colors.stone,
                    color: colors.anthracite,
                    border: `1px solid ${colors.mist}`,
                  }}
                >
                  Bekijk volledige planning
                </button>
              </Card>

              {/* Quick Actions */}
              <Card className="mt-6">
                <h2 className="text-base font-semibold mb-4" style={{ color: colors.anthracite }}>
                  Snelle Acties
                </h2>
                <div className="space-y-2">
                  <Button variant="accent" className="w-full justify-start">
                    <Plus className="w-4 h-4 mr-2" />
                    Nieuwe offerte
                  </Button>
                  <Button variant="secondary" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    Lead toevoegen
                  </Button>
                  <Button variant="secondary" className="w-full justify-start">
                    <Calendar className="w-4 h-4 mr-2" />
                    Afspraak plannen
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          {/* Alert Banner */}
          <div
            className="mt-6 p-4 rounded-lg flex items-center gap-3"
            style={{
              backgroundColor: `${colors.warning}10`,
              border: `1px solid ${colors.warning}30`,
            }}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: colors.warning }} />
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: colors.anthracite }}>
                3 offertes verlopen deze week
              </p>
              <p className="text-xs mt-0.5" style={{ color: colors.slate }}>
                Neem contact op met je klanten of verleng de geldigheid.
              </p>
            </div>
            <Button variant="ghost" size="sm">
              Bekijken
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
