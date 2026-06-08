import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';
import {
  demoLeads,
  demoQuotes,
  demoMessages,
  demoPricing,
  demoActivities,
  demoAppointments,
  demoProjects
} from '@/lib/demo/seedData';

export async function POST() {
  try {
    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    // Clear existing demo data
    await supabase.from('demo_appointments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('demo_projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('demo_lead_activities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('demo_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('demo_quotes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('demo_leads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('demo_pricing').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Insert demo leads (exclude id to let Supabase generate UUIDs)
    const { error: leadsError } = await supabase
      .from('demo_leads')
      .insert(demoLeads.map(lead => {
        const { id, ...leadData } = lead;
        return leadData;
      }));

    if (leadsError) {
      console.error('Error inserting demo leads:', leadsError);
      throw leadsError;
    }

    // Get the inserted leads to map IDs
    const { data: insertedLeads } = await supabase
      .from('demo_leads')
      .select('id, name')
      .order('created_at', { ascending: true });

    // Create ID mapping from old to new
    const leadIdMap: Record<string, string> = {};
    if (insertedLeads) {
      demoLeads.forEach((lead, index) => {
        if (insertedLeads[index]) {
          leadIdMap[lead.id] = insertedLeads[index].id;
        }
      });
    }

    // Insert demo pricing
    const { error: pricingError } = await supabase
      .from('demo_pricing')
      .insert(demoPricing);

    if (pricingError) {
      console.error('Error inserting demo pricing:', pricingError);
      throw pricingError;
    }

    // Insert demo quotes with mapped lead IDs
    const quotesToInsert = demoQuotes.map(quote => {
      const { id, ...quoteData } = quote;
      return {
        ...quoteData,
        lead_id: quote.lead_id ? leadIdMap[quote.lead_id] : null
      };
    });

    const { error: quotesError } = await supabase
      .from('demo_quotes')
      .insert(quotesToInsert);

    if (quotesError) {
      console.error('Error inserting demo quotes:', quotesError);
      throw quotesError;
    }

    // Get inserted quotes for ID mapping
    const { data: insertedQuotes } = await supabase
      .from('demo_quotes')
      .select('id, quote_number')
      .order('created_at', { ascending: true });

    const quoteIdMap: Record<string, string> = {};
    if (insertedQuotes) {
      demoQuotes.forEach((quote, index) => {
        if (insertedQuotes[index]) {
          quoteIdMap[quote.id] = insertedQuotes[index].id;
        }
      });
    }

    // Insert demo messages with mapped lead IDs
    const messagesToInsert = demoMessages.map(msg => {
      const { id, ...msgData } = msg;
      return {
        ...msgData,
        lead_id: msg.lead_id ? leadIdMap[msg.lead_id] : null
      };
    });

    const { error: messagesError } = await supabase
      .from('demo_messages')
      .insert(messagesToInsert);

    if (messagesError) {
      console.error('Error inserting demo messages:', messagesError);
      throw messagesError;
    }

    // Insert demo activities with mapped lead IDs
    const activitiesToInsert = demoActivities.map(activity => {
      const { id, ...activityData } = activity;
      return {
        ...activityData,
        lead_id: activity.lead_id ? leadIdMap[activity.lead_id] : null
      };
    });

    const { error: activitiesError } = await supabase
      .from('demo_lead_activities')
      .insert(activitiesToInsert);

    if (activitiesError) {
      console.error('Error inserting demo activities:', activitiesError);
      throw activitiesError;
    }

    // Insert demo appointments with mapped IDs
    const appointmentsToInsert = demoAppointments.map(apt => {
      const { id, ...aptData } = apt;
      return {
        ...aptData,
        lead_id: apt.lead_id ? leadIdMap[apt.lead_id] : null,
        quote_id: apt.quote_id ? quoteIdMap[apt.quote_id] : null
      };
    });

    const { error: appointmentsError } = await supabase
      .from('demo_appointments')
      .insert(appointmentsToInsert);

    if (appointmentsError) {
      console.error('Error inserting demo appointments:', appointmentsError);
      throw appointmentsError;
    }

    // Insert demo projects with mapped IDs
    const projectsToInsert = demoProjects.map(project => {
      const { id, ...projectData } = project;
      return {
        ...projectData,
        lead_id: project.lead_id ? leadIdMap[project.lead_id] : null,
        quote_id: project.quote_id ? quoteIdMap[project.quote_id] : null
      };
    });

    const { error: projectsError } = await supabase
      .from('demo_projects')
      .insert(projectsToInsert);

    if (projectsError) {
      console.error('Error inserting demo projects:', projectsError);
      throw projectsError;
    }

    return NextResponse.json({
      success: true,
      message: 'Demo data succesvol geladen',
      counts: {
        leads: demoLeads.length,
        quotes: demoQuotes.length,
        messages: demoMessages.length,
        pricing: demoPricing.length,
        activities: demoActivities.length,
        appointments: demoAppointments.length,
        projects: demoProjects.length
      }
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({
      success: false,
      error: 'Fout bij laden demo data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST naar dit endpoint om demo data te laden'
  });
}
