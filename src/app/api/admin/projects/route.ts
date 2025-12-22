import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ projects: [] });
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*, leads(name, city)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return NextResponse.json({ projects: [] });
    }

    const projectsWithLeadInfo = data?.map(project => ({
      ...project,
      lead_name: project.leads?.name,
      lead_city: project.leads?.city,
    })) || [];

    return NextResponse.json({ projects: projectsWithLeadInfo });
  } catch (error) {
    console.error('Projects API error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet beschikbaar' }, { status: 500 });
    }

    // Generate project number
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });

    const projectNumber = `P-${year}-${String((count || 0) + 1).padStart(3, '0')}`;

    const { data, error } = await supabase
      .from('projects')
      .insert({
        project_number: projectNumber,
        quote_id: body.quote_id,
        lead_id: body.lead_id,
        planned_start_date: body.planned_start_date,
        planned_end_date: body.planned_end_date,
        quoted_amount: body.quoted_amount,
        status: 'scheduled',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return NextResponse.json({ error: 'Kon project niet aanmaken' }, { status: 500 });
    }

    // Log activity
    if (body.lead_id) {
      await supabase.from('lead_activities').insert({
        lead_id: body.lead_id,
        activity_type: 'status_change',
        title: `Project ${projectNumber} aangemaakt`,
        description: `Gepland voor ${body.planned_start_date ? new Date(body.planned_start_date).toLocaleDateString('nl-NL') : 'nog te plannen'}`
      });
    }

    return NextResponse.json({ project: data });
  } catch (error) {
    console.error('Project create error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
