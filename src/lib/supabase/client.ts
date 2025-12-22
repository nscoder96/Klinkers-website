import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Client-side Supabase client (alleen aanmaken als URL beschikbaar is)
export const supabase: SupabaseClient | null = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Server-side client with service role (for API routes)
export function createServerClient(): SupabaseClient | null {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase niet geconfigureerd - database functionaliteit uitgeschakeld');
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Helper om te checken of Supabase geconfigureerd is
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

// Types voor de database tabellen
export interface Lead {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  postcode?: string;
  city: string;
  source?: 'website' | 'whatsapp' | 'phone' | 'werkspot' | 'referral' | 'flyer' | 'chat' | 'other';
  source_detail?: string;
  project_type?: string[];
  description?: string;
  estimated_m2?: number;
  budget_range?: 'under_2500' | '2500_5000' | '5000_10000' | '10000_plus' | 'unknown';
  urgency?: 'asap' | 'this_month' | 'this_quarter' | 'this_year' | 'exploring';
  ai_score?: number;
  ai_notes?: string;
  status: 'new' | 'contacted' | 'site_visit_scheduled' | 'quote_sent' | 'negotiating' | 'won' | 'lost' | 'dormant';
  lost_reason?: string;
  conversation_history?: Array<{ role: string; content: string }>;
}

export interface Pricing {
  id: string;
  category: string;
  item_name: string;
  item_description?: string;
  unit: string;
  cost_price?: number;
  labor_hours_per_unit?: number;
  labor_rate_per_hour: number;
  selling_price_min?: number;
  selling_price_max?: number;
  selling_price_default?: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
}

export interface Quote {
  id: string;
  quote_number: string;
  lead_id?: string;
  created_at: string;
  valid_until?: string;
  project_description?: string;
  project_address?: string;
  line_items: Array<{
    description: string;
    quantity: number;
    unit: string;
    unit_price: number;
    total: number;
  }>;
  subtotal?: number;
  btw_percentage: number;
  btw_amount?: number;
  total?: number;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';
  sent_at?: string;
  viewed_at?: string;
  responded_at?: string;
  pdf_url?: string;
  internal_notes?: string;
  customer_notes?: string;
}

export interface Message {
  id: string;
  lead_id?: string;
  created_at: string;
  channel: 'website_chat' | 'whatsapp' | 'email' | 'phone' | 'system';
  direction: 'inbound' | 'outbound';
  content: string;
  ai_generated: boolean;
  subject?: string;
  metadata?: Record<string, unknown>;
}
