'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/lib/useAdminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import { MapPin, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface Appointment {
  id: string;
  lead_id: string;
  lead_name?: string;
  scheduled_at: string;
  duration_minutes: number;
  appointment_type: string;
  title: string;
  description: string | null;
  location: string | null;
  status: string;
}

export default function PlanningPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = this week

  useEffect(() => {
    if (isAuthenticated) {
      fetchAppointments();
    }
  }, [isAuthenticated]);

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/admin/appointments');
      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments || []);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeekDates = (weekOffset: number) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1 + (weekOffset * 7)); // Monday

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates(selectedWeek);
  const weekDays = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt =>
      apt.scheduled_at.startsWith(dateStr)
    );
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAppointmentColor = (type: string) => {
    const colors: Record<string, string> = {
      site_visit: 'bg-purple-100 border-purple-300 text-purple-800',
      follow_up_call: 'bg-blue-100 border-blue-300 text-blue-800',
      project_start: 'bg-green-100 border-green-300 text-green-800',
      project_end: 'bg-orange-100 border-orange-300 text-orange-800',
      other: 'bg-gray-100 border-gray-300 text-gray-800',
    };
    return colors[type] || colors.other;
  };

  const getAppointmentLabel = (type: string) => {
    const labels: Record<string, string> = {
      site_visit: 'Locatiebezoek',
      follow_up_call: 'Terugbellen',
      project_start: 'Project start',
      project_end: 'Project einde',
      other: 'Overig',
    };
    return labels[type] || type;
  };

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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Planning</h1>
            <p className="text-gray-500">Beheer je afspraken en planning</p>
          </div>
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" /> Nieuwe afspraak
          </Button>
        </div>

        {/* Week Navigation */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setSelectedWeek(selectedWeek - 1)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Vorige week
              </Button>
              <div className="text-center">
                <p className="font-semibold">
                  {weekDates[0].toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}
                  {' - '}
                  {weekDates[6].toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                {selectedWeek === 0 && <span className="text-sm text-orange-500">Deze week</span>}
              </div>
              <Button
                variant="outline"
                onClick={() => setSelectedWeek(selectedWeek + 1)}
              >
                Volgende week <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Week Calendar */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-7 gap-2">
              {weekDates.map((date, index) => {
                const dayAppointments = getAppointmentsForDate(date);
                const isToday = date.toDateString() === new Date().toDateString();
                const isPast = date < new Date() && !isToday;

                return (
                  <div key={index} className={`min-h-[200px] border rounded-lg p-2 ${isToday ? 'border-orange-500 bg-orange-50' : isPast ? 'bg-gray-50' : ''}`}>
                    <div className={`text-center mb-2 pb-2 border-b ${isToday ? 'border-orange-300' : ''}`}>
                      <p className="text-sm font-medium text-gray-500">{weekDays[index]}</p>
                      <p className={`text-lg font-bold ${isToday ? 'text-orange-600' : ''}`}>
                        {date.getDate()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      {dayAppointments.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">Geen afspraken</p>
                      ) : (
                        dayAppointments.map((apt) => (
                          <div
                            key={apt.id}
                            className={`p-2 rounded border text-xs ${getAppointmentColor(apt.appointment_type)}`}
                          >
                            <p className="font-medium">{formatTime(apt.scheduled_at)}</p>
                            <p className="truncate">{apt.title}</p>
                            {apt.location && (
                              <p className="text-gray-600 truncate flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {apt.location}
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Komende afspraken</CardTitle>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Nog geen afspraken gepland</p>
                <p className="text-sm text-gray-400">
                  Tip: Plan een locatiebezoek vanuit een lead pagina
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments
                  .filter(apt => new Date(apt.scheduled_at) >= new Date())
                  .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
                  .slice(0, 10)
                  .map((apt) => (
                    <div key={apt.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[60px]">
                          <p className="text-sm font-medium">
                            {new Date(apt.scheduled_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                          </p>
                          <p className="text-lg font-bold">{formatTime(apt.scheduled_at)}</p>
                        </div>
                        <div>
                          <p className="font-medium">{apt.title}</p>
                          <div className="flex gap-2 text-sm text-gray-500">
                            <span className={`px-2 py-0.5 rounded text-xs ${getAppointmentColor(apt.appointment_type)}`}>
                              {getAppointmentLabel(apt.appointment_type)}
                            </span>
                            {apt.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {apt.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Bekijken
                      </Button>
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
