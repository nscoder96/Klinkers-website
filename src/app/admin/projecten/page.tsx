'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/lib/useAdminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import { Calendar, Flag } from 'lucide-react';

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
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
      in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      invoiced: 'bg-purple-100 text-purple-800 border-purple-200',
      paid: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Laden...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Projecten</h1>
          <p className="text-gray-500">Beheer je lopende en afgeronde projecten</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-2xl font-bold">{projects.length}</p>
              <p className="text-sm text-gray-500">Totaal projecten</p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-4 pb-4">
              <p className="text-2xl font-bold text-yellow-600">{statusCounts.in_progress}</p>
              <p className="text-sm text-yellow-700">In uitvoering</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-2xl font-bold">€{totalValue.toLocaleString('nl-NL')}</p>
              <p className="text-sm text-gray-500">Totale waarde</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-4 pb-4">
              <p className="text-2xl font-bold text-green-600">€{completedValue.toLocaleString('nl-NL')}</p>
              <p className="text-sm text-green-700">Afgerond</p>
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
                  className={filter === value ? 'bg-slate-800' : ''}
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
                <p className="text-gray-500 mb-4">Nog geen projecten</p>
                <p className="text-sm text-gray-400">
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
                  .map((project) => (
                    <div
                      key={project.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">{project.project_number}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                              {getStatusLabel(project.status)}
                            </span>
                          </div>
                          {project.lead_name && (
                            <Link href={`/admin/leads/${project.lead_id}`} className="text-sm text-blue-600 hover:underline">
                              {project.lead_name} - {project.lead_city}
                            </Link>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-orange-600">
                            €{Number(project.final_amount || project.quoted_amount).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                          </p>
                          {project.additional_work > 0 && (
                            <p className="text-sm text-green-600">
                              +€{Number(project.additional_work).toLocaleString('nl-NL')} meerwerk
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-4 text-sm text-gray-500">
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
                          <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600">
                            Start project
                          </Button>
                        )}
                        {project.status === 'in_progress' && (
                          <Button size="sm" className="bg-green-500 hover:bg-green-600">
                            Afronden
                          </Button>
                        )}
                        {project.status === 'completed' && (
                          <Button size="sm" className="bg-purple-500 hover:bg-purple-600">
                            Factureren
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
