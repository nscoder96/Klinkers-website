'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/lib/useAdminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import { Calendar, Flag } from 'lucide-react';

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
  success: '#22c55e',
  successLight: '#f0fdf4',
};

interface Project {
  id: string;
  project_number: string;
  quote_id: string;
  lead_id: string;
  lead_name?: string;
  lead_city?: string;
  planned_start_date: string | null;
  planned_end_date: string | null;
  actual_start_date: string | null;
  actual_end_date: string | null;
  status: string;
  quoted_amount: number;
  additional_work: number;
  final_amount: number | null;
}

export default function ProjectenPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/admin/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = filter === 'all'
    ? projects
    : projects.filter(p => p.status === filter);

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, { bg: string; text: string; border: string }> = {
      scheduled: { bg: colors.blueLight, text: colors.blue, border: colors.blue },
      in_progress: { bg: colors.orangeLight, text: colors.orange, border: colors.orange },
      completed: { bg: colors.successLight, text: colors.success, border: colors.success },
      invoiced: { bg: colors.stone, text: colors.dark, border: colors.mist },
      paid: { bg: colors.blueLight, text: colors.blue, border: colors.blue },
    };
    return statusColors[status] || { bg: colors.stone, text: colors.dark, border: colors.mist };
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      scheduled: 'Gepland',
      in_progress: 'In uitvoering',
      completed: 'Afgerond',
      invoiced: 'Gefactureerd',
      paid: 'Betaald',
    };
    return labels[status] || status;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const statusCounts = {
    all: projects.length,
    scheduled: projects.filter(p => p.status === 'scheduled').length,
    in_progress: projects.filter(p => p.status === 'in_progress').length,
    completed: projects.filter(p => p.status === 'completed').length,
    invoiced: projects.filter(p => p.status === 'invoiced').length,
    paid: projects.filter(p => p.status === 'paid').length,
  };

  const totalValue = projects.reduce((sum, p) => sum + (Number(p.quoted_amount) || 0), 0);
  const completedValue = projects
    .filter(p => ['completed', 'invoiced', 'paid'].includes(p.status))
    .reduce((sum, p) => sum + (Number(p.final_amount || p.quoted_amount) || 0), 0);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.stone }}>
        <p style={{ color: colors.slate }}>Laden...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: colors.dark }}>Projecten</h1>
          <p style={{ color: colors.slate }}>Beheer je lopende en afgeronde projecten</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-2xl font-bold">{projects.length}</p>
              <p className="text-sm" style={{ color: colors.slate }}>Totaal projecten</p>
            </CardContent>
          </Card>
          <Card style={{ backgroundColor: colors.orangeLight, borderColor: colors.orange, borderWidth: '1px' }}>
            <CardContent className="pt-4 pb-4">
              <p className="text-2xl font-bold" style={{ color: colors.orange }}>{statusCounts.in_progress}</p>
              <p className="text-sm" style={{ color: colors.orange }}>In uitvoering</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-2xl font-bold">€{totalValue.toLocaleString('nl-NL')}</p>
              <p className="text-sm" style={{ color: colors.slate }}>Totale waarde</p>
            </CardContent>
          </Card>
          <Card style={{ backgroundColor: colors.successLight, borderColor: colors.success, borderWidth: '1px' }}>
            <CardContent className="pt-4 pb-4">
              <p className="text-2xl font-bold" style={{ color: colors.success }}>€{completedValue.toLocaleString('nl-NL')}</p>
              <p className="text-sm" style={{ color: colors.success }}>Afgerond</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'all', label: 'Alles' },
                { value: 'scheduled', label: 'Gepland' },
                { value: 'in_progress', label: 'In uitvoering' },
                { value: 'completed', label: 'Afgerond' },
                { value: 'invoiced', label: 'Gefactureerd' },
                { value: 'paid', label: 'Betaald' },
              ].map(({ value, label }) => (
                <Button
                  key={value}
                  variant={filter === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(value)}
                  style={filter === value ? {
                    backgroundColor: colors.orange,
                    color: colors.warmWhite,
                    borderColor: colors.orange
                  } : {}}
                >
                  {label} ({statusCounts[value as keyof typeof statusCounts] || 0})
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Projects List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {filter === 'all' ? 'Alle projecten' : getStatusLabel(filter)} ({filteredProjects.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <p className="mb-4" style={{ color: colors.slate }}>Nog geen projecten</p>
                <p className="text-sm" style={{ color: colors.slate }}>
                  Projecten worden automatisch aangemaakt wanneer een offerte wordt geaccepteerd
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProjects
                  .sort((a, b) => {
                    const dateA = a.planned_start_date || '9999';
                    const dateB = b.planned_start_date || '9999';
                    return dateA.localeCompare(dateB);
                  })
                  .map((project) => {
                    const statusColor = getStatusColor(project.status);
                    return (
                    <div
                      key={project.id}
                      className="border rounded-lg p-4 transition-colors"
                      style={{
                        borderColor: colors.mist,
                        backgroundColor: colors.warmWhite,
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.stone}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.warmWhite}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg" style={{ color: colors.dark }}>{project.project_number}</h3>
                            <span
                              className="px-2 py-1 rounded-full text-xs font-medium border"
                              style={{
                                backgroundColor: statusColor.bg,
                                color: statusColor.text,
                                borderColor: statusColor.border,
                              }}
                            >
                              {getStatusLabel(project.status)}
                            </span>
                          </div>
                          {project.lead_name && (
                            <Link href={`/admin/leads/${project.lead_id}`} className="text-sm hover:underline" style={{ color: colors.blue }}>
                              {project.lead_name} - {project.lead_city}
                            </Link>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold" style={{ color: colors.orange }}>
                            €{Number(project.final_amount || project.quoted_amount).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                          </p>
                          {project.additional_work > 0 && (
                            <p className="text-sm" style={{ color: colors.success }}>
                              +€{Number(project.additional_work).toLocaleString('nl-NL')} meerwerk
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-4 text-sm" style={{ color: colors.slate }}>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" /> Start: {formatDate(project.planned_start_date || project.actual_start_date)}
                        </span>
                        {project.planned_end_date && (
                          <span className="flex items-center gap-1">
                            <Flag className="w-4 h-4" /> Einde: {formatDate(project.planned_end_date)}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline">
                          Bekijken
                        </Button>
                        {project.status === 'scheduled' && (
                          <Button
                            size="sm"
                            style={{
                              backgroundColor: colors.blue,
                              color: colors.warmWhite,
                              border: 'none'
                            }}
                          >
                            Start project
                          </Button>
                        )}
                        {project.status === 'in_progress' && (
                          <Button
                            size="sm"
                            style={{
                              backgroundColor: colors.orange,
                              color: colors.warmWhite,
                              border: 'none'
                            }}
                          >
                            Afronden
                          </Button>
                        )}
                        {project.status === 'completed' && (
                          <Button
                            size="sm"
                            style={{
                              backgroundColor: colors.success,
                              color: colors.warmWhite,
                              border: 'none'
                            }}
                          >
                            Factureren
                          </Button>
                        )}
                      </div>
                    </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
