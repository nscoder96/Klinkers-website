import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email } = body;

    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet beschikbaar' }, { status: 500 });
    }

    const duplicates: Array<{
      id: string;
      name: string;
      phone: string | null;
      email: string | null;
      city: string | null;
      status: string;
      match_type: 'name' | 'phone' | 'email';
    }> = [];

    // Check by phone (most reliable)
    if (phone && phone.trim().length >= 8) {
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
      const { data: phoneMatches } = await supabase
        .from('leads')
        .select('id, name, phone, email, city, status')
        .or(`phone.ilike.%${cleanPhone.slice(-8)}%`);

      if (phoneMatches && phoneMatches.length > 0) {
        phoneMatches.forEach(match => {
          if (!duplicates.find(d => d.id === match.id)) {
            duplicates.push({ ...match, match_type: 'phone' });
          }
        });
      }
    }

    // Check by email (also reliable)
    if (email && email.trim().length > 3 && email.includes('@')) {
      const { data: emailMatches } = await supabase
        .from('leads')
        .select('id, name, phone, email, city, status')
        .ilike('email', email.trim());

      if (emailMatches && emailMatches.length > 0) {
        emailMatches.forEach(match => {
          if (!duplicates.find(d => d.id === match.id)) {
            duplicates.push({ ...match, match_type: 'email' });
          }
        });
      }
    }

    // Check by name (less reliable, use fuzzy match)
    if (name && name.trim().length >= 3) {
      const { data: nameMatches } = await supabase
        .from('leads')
        .select('id, name, phone, email, city, status')
        .ilike('name', `%${name.trim()}%`);

      if (nameMatches && nameMatches.length > 0) {
        nameMatches.forEach(match => {
          if (!duplicates.find(d => d.id === match.id)) {
            duplicates.push({ ...match, match_type: 'name' });
          }
        });
      }
    }

    return NextResponse.json({
      hasDuplicates: duplicates.length > 0,
      duplicates: duplicates.slice(0, 5) // Max 5 results
    });
  } catch (error) {
    console.error('Duplicate check error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
