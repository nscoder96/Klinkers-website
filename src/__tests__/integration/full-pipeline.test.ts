/**
 * Full Pipeline Integration Tests
 *
 * Tests that verify the complete end-to-end flow:
 * Layer 1 (AI Understanding) → Layer 2 (Business Logic) → Layer 3 (Pricing)
 *
 * These tests use mocked AI responses for CI reliability.
 * Set REAL_AI_TESTS=true to optionally test against actual Claude API.
 *
 * CRITICAL validations:
 * - Three-layer data flow maintains no-price constraint through layers 1-2
 * - Herstraten logic works end-to-end (AI-04)
 * - Dimension extraction and quantity calculations flow correctly
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { analyzeNotes } from '@/lib/services/ai-understanding.service';
import { generateWorkBreakdown, processAIOutput } from '@/lib/services/business-logic.service';
import { AIUnderstandingResult } from '@/lib/schemas/ai-understanding.schema';
import { FULL_SCHOUWNOTITIE_EXAMPLES } from '../fixtures/schouwnotities';
import type { LaborNorm } from '@/lib/services/labor-norms';

// C3: analyzeNotes vereist urennormen (prompt uit de database, geen terugval).
// De Anthropic-client is gemockt, dus één minimale norm volstaat hier.
const TEST_NORMS: LaborNorm[] = [{
  work_type_key: 'klinkers-herstraten',
  label: 'Klinkers herstraten',
  category: 'Herstraten/herleggen',
  unit: 'm²',
  hours_per_unit: 1,
  basis_qty: 10,
  display_text: null,
  sort_order: 1,
  source: 'handmatig',
  is_active: true,
}];

// Create a mock parse function
const mockParse = vi.fn();

// Mock the Anthropic SDK for mocked tests
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      beta = {
        messages: {
          parse: mockParse
        }
      };
    }
  };
});

describe('Full Pipeline Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('With Mocked AI', () => {
    test('simple single-category project flows through all layers', async () => {
      const simpleExample = FULL_SCHOUWNOTITIE_EXAMPLES.find(
        e => e.name === 'Simple - Single category terras'
      )!;

      // Mock AI response
      const mockAIResponse: AIUnderstandingResult = {
        activities: [
          {
            type: 'bestrating',
            action: 'nieuw',
            description: 'Terras aanleggen met nieuwe klinkers',
            dimensions: {
              length: 6,
              width: 4,
              area: 24
            },
            source_text: simpleExample.text,
            materials_mentioned: ['klinkers', 'opsluitbanden']
          }
        ],
        summary: 'Terras aanleggen met klinkers en opsluitbanden',
        confidence: 0.95
      };

      mockParse.mockResolvedValue({
        parsed_output: mockAIResponse
      });

      // Layer 1: AI Understanding
      const aiResult = await analyzeNotes(simpleExample.text, TEST_NORMS);

      expect(aiResult.activities).toHaveLength(1);
      expect(aiResult.activities[0].type).toBe('bestrating');
      expect(aiResult.activities[0].action).toBe('nieuw');
      expect(aiResult.activities[0].dimensions.area).toBe(24);

      // Verify NO price fields in Layer 1 output
      expect(aiResult).not.toHaveProperty('price');
      expect(aiResult).not.toHaveProperty('total');
      aiResult.activities.forEach(activity => {
        expect(activity).not.toHaveProperty('price');
        expect(activity).not.toHaveProperty('cost');
      });

      // Layer 2: Business Logic
      const breakdown = await generateWorkBreakdown(aiResult);

      expect(breakdown.items.length).toBeGreaterThan(0);

      const materialItems = breakdown.items.filter(i => i.line_type === 'materiaal');
      const laborItems = breakdown.items.filter(i => i.line_type === 'arbeid');

      expect(materialItems.length).toBeGreaterThan(0);
      expect(laborItems.length).toBeGreaterThan(0);

      // Verify NO price fields in Layer 2 output
      expect(breakdown).not.toHaveProperty('total_price');
      expect(breakdown).not.toHaveProperty('subtotal');
      breakdown.items.forEach(item => {
        expect(item).not.toHaveProperty('price');
        expect(item).not.toHaveProperty('unit_price');
        expect(item).not.toHaveProperty('total');
      });
    });

    test('multi-category project detects multiple activities', async () => {
      const multiExample = FULL_SCHOUWNOTITIE_EXAMPLES.find(
        e => e.name === 'Medium - Terras + Schutting (2 categories)'
      )!;

      const mockAIResponse: AIUnderstandingResult = {
        activities: [
          {
            type: 'bestrating',
            action: 'nieuw',
            description: 'Terras aanleggen met keramische tegels',
            dimensions: { area: 40 },
            source_text: '40m2 keramische tegels leggen',
            materials_mentioned: ['keramische tegels', 'zand', 'puin']
          },
          {
            type: 'erfafscheiding',
            action: 'vervangen',
            description: 'Schutting vervangen',
            dimensions: { length: 15, height: 1.8 },
            source_text: 'Bestaande schutting 15m vervangen',
            materials_mentioned: ['21-planks schutting', 'betonpalen']
          }
        ],
        summary: 'Terras aanleggen en schutting vervangen',
        confidence: 0.9
      };

      mockParse.mockResolvedValue({
        parsed_output: mockAIResponse
      });

      // Layer 1: AI Understanding
      const aiResult = await analyzeNotes(multiExample.text, TEST_NORMS);

      expect(aiResult.activities.length).toBeGreaterThanOrEqual(2);

      const categories = aiResult.activities.map(a => a.type);
      expect(categories).toContain('bestrating');
      expect(categories).toContain('erfafscheiding');

      // Layer 2: Business Logic
      const breakdown = await generateWorkBreakdown(aiResult);

      const bestratingItems = breakdown.items.filter(i => i.category === 'bestrating');
      const erfafscheidingItems = breakdown.items.filter(i => i.category === 'erfafscheiding');

      expect(bestratingItems.length).toBeGreaterThan(0);
      expect(erfafscheidingItems.length).toBeGreaterThan(0);
    });

    test('herstraten pipeline generates arbeid-only items (AI-04 end-to-end)', async () => {
      const herstratenExample = FULL_SCHOUWNOTITIE_EXAMPLES.find(
        e => e.name === 'Herstraten - Re-laying work (arbeid only, no materials)'
      )!;

      const mockAIResponse: AIUnderstandingResult = {
        activities: [
          {
            type: 'bestrating',
            action: 'herstraten',
            description: 'Bestaande klinkers opnieuw leggen',
            dimensions: { area: 30 },
            source_text: 'Bestaande klinkers oprit opnemen en herstraten',
            materials_mentioned: ['zand', 'voegzand'] // Minimal materials mentioned
          }
        ],
        summary: 'Herstraten oprit met bestaande klinkers',
        confidence: 0.95
      };

      mockParse.mockResolvedValue({
        parsed_output: mockAIResponse
      });

      // Layer 1: AI detects herstraten action
      const aiResult = await analyzeNotes(herstratenExample.text, TEST_NORMS);

      expect(aiResult.activities).toHaveLength(1);
      expect(aiResult.activities[0].action).toBe('herstraten');

      // Layer 2: Business logic generates ONLY arbeid items
      const breakdown = await generateWorkBreakdown(aiResult);

      const materialItems = breakdown.items.filter(i => i.line_type === 'materiaal');
      const laborItems = breakdown.items.filter(i => i.line_type === 'arbeid');

      // CRITICAL: Herstraten should have NO material items
      expect(materialItems).toHaveLength(0);
      expect(laborItems.length).toBeGreaterThan(0);
      expect(laborItems.every(i => i.is_herstraten)).toBe(true);
      expect(breakdown.summary).toContain('herstraat');
    });

    test('mixed herstraten and nieuw in same project', async () => {
      const mixedExample = FULL_SCHOUWNOTITIE_EXAMPLES.find(
        e => e.name === 'Mixed - Combination herstraten + nieuw'
      )!;

      const mockAIResponse: AIUnderstandingResult = {
        activities: [
          {
            type: 'bestrating',
            action: 'herstraten',
            description: 'Bestaand terras herstraten',
            dimensions: { area: 20 },
            source_text: 'Bestaand terras 20m2 herstraten',
            materials_mentioned: []
          },
          {
            type: 'bestrating',
            action: 'nieuw',
            description: 'Uitbreiding terras met nieuwe tegels',
            dimensions: { area: 15 },
            source_text: 'Uitbreiding 15m2 met nieuwe tegels',
            materials_mentioned: ['tegels']
          },
          {
            type: 'bestrating',
            action: 'repareren',
            description: 'Borders repareren',
            dimensions: { length: 10 },
            source_text: 'Bestaande borders 10m repareren',
            materials_mentioned: []
          },
          {
            type: 'bestrating',
            action: 'vervangen',
            description: 'Opsluitbanden vervangen',
            dimensions: { length: 12 },
            source_text: 'Bestaande banden 12m vervangen',
            materials_mentioned: ['opsluitbanden']
          }
        ],
        summary: 'Mix van herstraten, nieuw, repareren en vervangen werk',
        confidence: 0.9
      };

      mockParse.mockResolvedValue({
        parsed_output: mockAIResponse
      });

      const aiResult = await analyzeNotes(mixedExample.text, TEST_NORMS);
      const breakdown = await generateWorkBreakdown(aiResult);

      const herstratenItems = breakdown.items.filter(i => i.is_herstraten);
      const normalItems = breakdown.items.filter(i => !i.is_herstraten);
      const allMaterialItems = breakdown.items.filter(i => i.line_type === 'materiaal');

      // Herstraten and repareren items: only arbeid
      expect(herstratenItems.length).toBeGreaterThan(0);
      expect(herstratenItems.every(i => i.line_type === 'arbeid')).toBe(true);

      // Nieuw and vervangen items: include materials
      expect(normalItems.length).toBeGreaterThan(0);
      expect(allMaterialItems.length).toBeGreaterThan(0);
      expect(allMaterialItems.every(i => !i.is_herstraten)).toBe(true);
    });

    test('three-layer data flow maintains no-price constraint', async () => {
      const simpleExample = FULL_SCHOUWNOTITIE_EXAMPLES[0];

      const mockAIResponse: AIUnderstandingResult = {
        activities: [
          {
            type: 'bestrating',
            action: 'nieuw',
            description: 'Terras aanleggen',
            dimensions: { area: 40 },
            source_text: simpleExample.text,
            materials_mentioned: ['tegels']
          }
        ],
        summary: 'Terras werk',
        confidence: 0.9
      };

      mockParse.mockResolvedValue({
        parsed_output: mockAIResponse
      });

      // Layer 1: AI Understanding
      const aiResult = await analyzeNotes(simpleExample.text, TEST_NORMS);

      // Verify Layer 1 has NO price fields
      const aiResultKeys = Object.keys(aiResult);
      expect(aiResultKeys).not.toContain('price');
      expect(aiResultKeys).not.toContain('total');
      expect(aiResultKeys).not.toContain('cost');

      // Layer 2: Business Logic
      const breakdown = await generateWorkBreakdown(aiResult);

      // Verify Layer 2 has NO price fields
      const breakdownKeys = Object.keys(breakdown);
      expect(breakdownKeys).not.toContain('price');
      expect(breakdownKeys).not.toContain('total_price');
      expect(breakdownKeys).not.toContain('subtotal');

      breakdown.items.forEach(item => {
        const itemKeys = Object.keys(item);
        expect(itemKeys).not.toContain('price');
        expect(itemKeys).not.toContain('unit_price');
        expect(itemKeys).not.toContain('total');
      });

      // Layer 3 would add prices via database lookup (tested separately)
      // This test confirms layers 1-2 never generate prices
    });

    test('complex multi-category renovation flows correctly', async () => {
      const complexExample = FULL_SCHOUWNOTITIE_EXAMPLES.find(
        e => e.name === 'Complex - Full renovation (5+ categories)'
      )!;

      const mockAIResponse: AIUnderstandingResult = {
        activities: [
          {
            type: 'bestrating',
            action: 'verwijderen',
            description: 'Bestaande bestrating verwijderen',
            dimensions: { area: 25 },
            source_text: 'Bestaande bestrating verwijderen en afvoeren (25m2)',
            materials_mentioned: []
          },
          {
            type: 'grondwerk',
            action: 'nieuw',
            description: 'Grond afgraven voor nieuwe fundering',
            dimensions: { area: 25, height: 0.3 },
            source_text: 'Grond afgraven 30cm diep voor nieuwe fundering',
            materials_mentioned: []
          },
          {
            type: 'bestrating',
            action: 'nieuw',
            description: 'Oprit met nieuwe betonklinkers',
            dimensions: { area: 18 },
            source_text: 'Oprit 18m2 nieuwe betonklinkers grijs',
            materials_mentioned: ['betonklinkers']
          },
          {
            type: 'beplanting',
            action: 'nieuw',
            description: 'Haag planten',
            dimensions: { length: 8, count: 16 },
            source_text: 'Haag planten langs straatkant (8 meter, 16 planten)',
            materials_mentioned: ['planten']
          },
          {
            type: 'gazon',
            action: 'nieuw',
            description: 'Gazon aanleggen',
            dimensions: { area: 60 },
            source_text: 'Gazon aanleggen 60m2 met graszoden',
            materials_mentioned: ['graszoden']
          },
          {
            type: 'waterwerken',
            action: 'nieuw',
            description: 'Vijver aanleggen',
            dimensions: { length: 2, width: 3, area: 6 },
            source_text: 'Vijver aanleggen 2x3m met vijverfolie',
            materials_mentioned: ['vijverfolie']
          },
          {
            type: 'verlichting',
            action: 'nieuw',
            description: 'Tuinverlichting plaatsen',
            dimensions: { count: 8 },
            source_text: 'Tuinverlichting: 6 spots langs pad, 2 spots bij terras',
            materials_mentioned: ['spots']
          }
        ],
        summary: 'Complete tuinrenovatie met meerdere categorieën werk',
        confidence: 0.85
      };

      mockParse.mockResolvedValue({
        parsed_output: mockAIResponse
      });

      const aiResult = await analyzeNotes(complexExample.text, TEST_NORMS);

      expect(aiResult.activities.length).toBeGreaterThanOrEqual(5);

      const categories = new Set(aiResult.activities.map(a => a.type));
      expect(categories.size).toBeGreaterThanOrEqual(5);

      const breakdown = await generateWorkBreakdown(aiResult);

      expect(breakdown.items.length).toBeGreaterThan(aiResult.activities.length);

      const itemCategories = new Set(breakdown.items.map(i => i.category));
      expect(itemCategories.size).toBeGreaterThanOrEqual(5);
    });

    test('error boundaries: invalid AI output caught by Business Logic', () => {
      const invalidAIOutput = {
        activities: [
          {
            type: 'invalid_category',
            action: 'nieuw',
            description: 'Test',
            dimensions: {},
            source_text: 'Test',
            materials_mentioned: []
          }
        ],
        summary: 'Test',
        confidence: 0.9
      };

      expect(() => processAIOutput(invalidAIOutput)).toThrow();
    });

    test('dimension calculations flow correctly from AI to work items', async () => {
      const mockAIResponse: AIUnderstandingResult = {
        activities: [
          {
            type: 'bestrating',
            action: 'nieuw',
            description: 'Terras aanleggen',
            dimensions: {
              length: 8,
              width: 5,
              area: 40 // AI calculated this
            },
            source_text: 'Terras 8x5m',
            materials_mentioned: []
          }
        ],
        summary: 'Terras',
        confidence: 0.9
      };

      mockParse.mockResolvedValue({
        parsed_output: mockAIResponse
      });

      const aiResult = await analyzeNotes('Terras 8x5m', TEST_NORMS);

      expect(aiResult.activities[0].dimensions.length).toBe(8);
      expect(aiResult.activities[0].dimensions.width).toBe(5);
      expect(aiResult.activities[0].dimensions.area).toBe(40);

      const breakdown = await generateWorkBreakdown(aiResult);
      const materialItem = breakdown.items.find(i => i.line_type === 'materiaal');

      expect(materialItem).toBeDefined();
      expect(materialItem!.quantity).toBe(40); // Uses area
      expect(materialItem!.unit).toBe('m2');
    });

    test('verwijderen generates arbeid-only items (no materials)', async () => {
      const mockAIResponse: AIUnderstandingResult = {
        activities: [
          {
            type: 'bestrating',
            action: 'verwijderen',
            description: 'Bestaande bestrating verwijderen en afvoeren',
            dimensions: { area: 25 },
            source_text: 'Bestaande bestrating verwijderen 25m2',
            materials_mentioned: []
          }
        ],
        summary: 'Bestrating verwijderen',
        confidence: 0.95
      };

      mockParse.mockResolvedValue({
        parsed_output: mockAIResponse
      });

      const aiResult = await analyzeNotes('Bestrating verwijderen', TEST_NORMS);
      expect(aiResult.activities[0].action).toBe('verwijderen');

      const breakdown = await generateWorkBreakdown(aiResult);

      const materialItems = breakdown.items.filter(i => i.line_type === 'materiaal');
      const laborItems = breakdown.items.filter(i => i.line_type === 'arbeid');

      // CRITICAL: verwijderen should have NO material items
      expect(materialItems).toHaveLength(0);
      expect(laborItems.length).toBeGreaterThan(0);
    });

    test('mixed herstraten + nieuw + verwijderen correctly splits item types', async () => {
      const mockAIResponse: AIUnderstandingResult = {
        activities: [
          {
            type: 'bestrating',
            action: 'herstraten',
            description: 'Bestaande klinkers herstraten',
            dimensions: { area: 20 },
            source_text: 'Bestaande klinkers 20m2 herstraten',
            materials_mentioned: []
          },
          {
            type: 'bestrating',
            action: 'nieuw',
            description: 'Nieuw bestrating aanleggen',
            dimensions: { area: 15 },
            source_text: 'Nieuwe klinkers 15m2 aanleggen',
            materials_mentioned: ['klinkers']
          },
          {
            type: 'erfafscheiding',
            action: 'verwijderen',
            description: 'Erfafscheiding verwijderen',
            dimensions: { length: 8 },
            source_text: 'Bestaande schutting 8m verwijderen',
            materials_mentioned: []
          }
        ],
        summary: 'Mix van herstraten, nieuw en verwijderen',
        confidence: 0.9
      };

      mockParse.mockResolvedValue({
        parsed_output: mockAIResponse
      });

      const aiResult = await analyzeNotes('Mixed actions test', TEST_NORMS);
      const breakdown = await generateWorkBreakdown(aiResult);

      // Activity 1 (herstraten): arbeid only, is_herstraten=true
      const herstratenItems = breakdown.items.filter(
        i => i.category === 'bestrating' && i.is_herstraten
      );
      expect(herstratenItems.every(i => i.line_type === 'arbeid')).toBe(true);

      // Activity 2 (nieuw): both materiaal and arbeid, is_herstraten=false
      const nieuwBestratingItems = breakdown.items.filter(
        i => i.category === 'bestrating' && !i.is_herstraten
      );
      const nieuwMaterialItems = nieuwBestratingItems.filter(i => i.line_type === 'materiaal');
      const nieuwLaborItems = nieuwBestratingItems.filter(i => i.line_type === 'arbeid');
      expect(nieuwMaterialItems.length).toBeGreaterThan(0);
      expect(nieuwLaborItems.length).toBeGreaterThan(0);

      // Activity 3 (verwijderen): arbeid only, is_herstraten=false
      const verwijderenItems = breakdown.items.filter(
        i => i.category === 'erfafscheiding'
      );
      expect(verwijderenItems.every(i => i.line_type === 'arbeid')).toBe(true);
      expect(verwijderenItems.every(i => !i.is_herstraten)).toBe(true);
    });

    test('vervangen generates both arbeid and materiaal items', async () => {
      const mockAIResponse: AIUnderstandingResult = {
        activities: [
          {
            type: 'erfafscheiding',
            action: 'vervangen',
            description: 'Schutting vervangen',
            dimensions: { length: 12 },
            source_text: 'Bestaande schutting 12m vervangen',
            materials_mentioned: ['21-planks schutting']
          }
        ],
        summary: 'Schutting vervangen',
        confidence: 0.95
      };

      mockParse.mockResolvedValue({
        parsed_output: mockAIResponse
      });

      const aiResult = await analyzeNotes('Schutting vervangen', TEST_NORMS);
      expect(aiResult.activities[0].action).toBe('vervangen');

      const breakdown = await generateWorkBreakdown(aiResult);

      const materialItems = breakdown.items.filter(i => i.line_type === 'materiaal');
      const laborItems = breakdown.items.filter(i => i.line_type === 'arbeid');

      // vervangen generates BOTH material and labor items (unlike herstraten)
      expect(materialItems.length).toBeGreaterThan(0);
      expect(laborItems.length).toBeGreaterThan(0);
      expect(breakdown.items.every(i => !i.is_herstraten)).toBe(true);
    });

    test('all arbeid-only actions produce zero materiaal items across categories', async () => {
      const arbeidOnlyActions = ['herstraten', 'repareren', 'verwijderen'] as const;
      const testCategories = ['bestrating', 'erfafscheiding', 'vlonders'] as const;

      for (const action of arbeidOnlyActions) {
        for (const category of testCategories) {
          const mockAIResponse: AIUnderstandingResult = {
            activities: [
              {
                type: category,
                action: action,
                description: `Test ${action} for ${category}`,
                dimensions: { area: 10 },
                source_text: `Test ${action} ${category}`,
                materials_mentioned: []
              }
            ],
            summary: `Test ${action}`,
            confidence: 0.9
          };

          mockParse.mockResolvedValue({
            parsed_output: mockAIResponse
          });

          const aiResult = await analyzeNotes(`Test ${action} ${category}`, TEST_NORMS);
          const breakdown = await generateWorkBreakdown(aiResult);

          const materialItems = breakdown.items.filter(i => i.line_type === 'materiaal');

          // CRITICAL: All arbeid-only actions must produce ZERO material items
          expect(materialItems).toHaveLength(0);
        }
      }
    });
  });

  describe.skipIf(!process.env.REAL_AI_TESTS)('With Real AI', () => {
    test('real AI test: simple terras project', async () => {
      // This test only runs when REAL_AI_TESTS=true
      // Useful for validating actual AI behavior during development

      const simpleExample = FULL_SCHOUWNOTITIE_EXAMPLES[0];

      // Note: This will call the real Anthropic API
      // Requires ANTHROPIC_API_KEY in environment
      const aiResult = await analyzeNotes(simpleExample.text, TEST_NORMS);

      expect(aiResult.activities.length).toBeGreaterThan(0);
      expect(aiResult.confidence).toBeGreaterThan(0.5);

      const breakdown = await generateWorkBreakdown(aiResult);
      expect(breakdown.items.length).toBeGreaterThan(0);
    });
  });
});
