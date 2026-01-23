import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export interface PricingHierarchyItem {
  id: string;
  category: string;
  subcategory: string | null;
  item_name: string;
  item_type: 'arbeid' | 'materiaal';
  unit: string;
  selling_price_default: number;
}

export interface SubcategoryGroup {
  label: string;
  items: PricingHierarchyItem[];
}

export interface CategoryGroup {
  label: string;
  subcategories: Record<string, SubcategoryGroup>;
}

export type PricingHierarchy = Record<string, CategoryGroup>;

const CATEGORY_LABELS: Record<string, string> = {
  grondwerk: 'Grondwerk',
  bestrating: 'Bestrating',
  erfafscheiding: 'Erfafscheiding',
  vlonders: 'Vlonders & Terrassen',
  gazon: 'Gazon',
  beplanting: 'Beplanting',
  overkappingen: 'Overkappingen',
  waterwerken: 'Waterwerken',
  verlichting: 'Verlichting & Irrigatie',
  overig: 'Overig',
};

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function GET(request: Request) {
  try {
    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database niet beschikbaar' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const itemType = searchParams.get('type') || 'materiaal';

    const { data, error } = await supabase
      .from('pricing')
      .select('id, category, subcategory, item_name, item_type, unit, selling_price_default')
      .eq('is_active', true)
      .eq('item_type', itemType)
      .order('category', { ascending: true })
      .order('subcategory', { ascending: true })
      .order('item_name', { ascending: true });

    if (error) {
      console.error('Error fetching pricing hierarchy:', error);
      return NextResponse.json({ error: 'Kon prijzen niet ophalen' }, { status: 500 });
    }

    // Group into hierarchy
    const hierarchy: PricingHierarchy = {};

    for (const item of data || []) {
      const cat = item.category;
      const subcat = item.subcategory || '_ungrouped';

      if (!hierarchy[cat]) {
        hierarchy[cat] = {
          label: CATEGORY_LABELS[cat] || capitalizeFirst(cat),
          subcategories: {},
        };
      }

      if (!hierarchy[cat].subcategories[subcat]) {
        hierarchy[cat].subcategories[subcat] = {
          label: subcat === '_ungrouped' ? 'Overig' : capitalizeFirst(subcat),
          items: [],
        };
      }

      hierarchy[cat].subcategories[subcat].items.push({
        id: item.id,
        category: item.category,
        subcategory: item.subcategory,
        item_name: item.item_name,
        item_type: item.item_type,
        unit: item.unit,
        selling_price_default: Number(item.selling_price_default),
      });
    }

    return NextResponse.json({ hierarchy });
  } catch (error) {
    console.error('Pricing hierarchy API error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
