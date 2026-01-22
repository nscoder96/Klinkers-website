/**
 * Business Logic Service Tests
 *
 * Tests for the Business Logic layer (Layer 2) focusing on:
 * - processAIOutput validation
 * - Herstraten logic (CRITICAL for AI-04)
 * - Quantity calculations
 * - Category mapping
 *
 * These tests verify the business rules are correctly applied when
 * transforming AI understanding results into work breakdowns.
 */

import { describe, test, expect } from 'vitest';
import {
  processAIOutput,
  generateWorkBreakdown,
  ValidationError
} from '@/lib/services/business-logic.service';
import { AIUnderstandingResult } from '@/lib/schemas/ai-understanding.schema';

describe('Business Logic Service', () => {
  describe('processAIOutput Validation', () => {
    test('valid input passes validation', () => {
      const validInput: AIUnderstandingResult = {
        activities: [
          {
            type: 'bestrating',
            action: 'nieuw',
            description: 'Terras aanleggen',
            dimensions: { area: 40 },
            source_text: 'Terras 40m2',
            materials_mentioned: ['tegels']
          }
        ],
        summary: 'Terras werk',
        confidence: 0.9
      };

      const result = processAIOutput(validInput);
      expect(result).toEqual(validInput);
    });

    test('invalid input throws ValidationError', () => {
      const invalidInput = {
        activities: [
          {
            type: 'invalid_type',
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

      expect(() => processAIOutput(invalidInput)).toThrow(ValidationError);
    });

    test('ValidationError contains readable message', () => {
      const invalidInput = {
        activities: [],
        // Missing summary and confidence
      };

      try {
        processAIOutput(invalidInput);
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain('validation failed');
      }
    });

    test('ValidationError contains zodError property', () => {
      const invalidInput = {
        activities: [],
        confidence: 1.5 // Invalid: > 1
      };

      try {
        processAIOutput(invalidInput);
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).zodError).toBeDefined();
        expect((error as ValidationError).zodError.issues).toBeDefined();
      }
    });
  });

  describe('Herstraten Logic (AI-04 - CRITICAL)', () => {
    test('herstraten action generates ONLY arbeid items', async () => {
      const aiResult: AIUnderstandingResult = {
        activities: [
          {
            type: 'bestrating',
            action: 'herstraten',
            description: 'Bestaande tegels opnieuw leggen',
            dimensions: { area: 40 },
            source_text: 'Herstraten terras 40m2',
            materials_mentioned: []
          }
        ],
        summary: 'Herstraten project',
        confidence: 0.9
      };

      const breakdown = await generateWorkBreakdown(aiResult);

      const materialItems = breakdown.items.filter(i => i.line_type === 'materiaal');
      const laborItems = breakdown.items.filter(i => i.line_type === 'arbeid');

      // CRITICAL: No materials for herstraten
      expect(materialItems).toHaveLength(0);
      expect(laborItems.length).toBeGreaterThan(0);
      expect(laborItems[0].is_herstraten).toBe(true);
    });

    test('repareren action generates ONLY arbeid items', async () => {
      const aiResult: AIUnderstandingResult = {
        activities: [
          {
            type: 'erfafscheiding',
            action: 'repareren',
            description: 'Schutting repareren, losse planken vervangen',
            dimensions: { length: 15 },
            source_text: 'Schutting repareren 15m',
            materials_mentioned: []
          }
        ],
        summary: 'Reparatie werk',
        confidence: 0.9
      };

      const breakdown = await generateWorkBreakdown(aiResult);

      const materialItems = breakdown.items.filter(i => i.line_type === 'materiaal');
      const laborItems = breakdown.items.filter(i => i.line_type === 'arbeid');

      // CRITICAL: No materials for repareren
      expect(materialItems).toHaveLength(0);
      expect(laborItems.length).toBeGreaterThan(0);
      expect(laborItems[0].is_herstraten).toBe(true);
    });

    test('nieuw action generates BOTH arbeid and materiaal items', async () => {
      const aiResult: AIUnderstandingResult = {
        activities: [
          {
            type: 'bestrating',
            action: 'nieuw',
            description: 'Nieuwe tegels leggen',
            dimensions: { area: 40 },
            source_text: 'Terras 40m2 nieuwe tegels',
            materials_mentioned: ['tegels']
          }
        ],
        summary: 'Nieuw terras',
        confidence: 0.9
      };

      const breakdown = await generateWorkBreakdown(aiResult);

      const materialItems = breakdown.items.filter(i => i.line_type === 'materiaal');
      const laborItems = breakdown.items.filter(i => i.line_type === 'arbeid');

      // Normal flow includes both materials and labor
      expect(materialItems.length).toBeGreaterThan(0);
      expect(laborItems.length).toBeGreaterThan(0);
      expect(materialItems[0].is_herstraten).toBe(false);
      expect(laborItems[0].is_herstraten).toBe(false);
    });

    test('vervangen action generates BOTH arbeid and materiaal items', async () => {
      const aiResult: AIUnderstandingResult = {
        activities: [
          {
            type: 'erfafscheiding',
            action: 'vervangen',
            description: 'Oude schutting vervangen door nieuwe',
            dimensions: { length: 12 },
            source_text: 'Schutting vervangen 12m',
            materials_mentioned: ['schutting', 'betonpalen']
          }
        ],
        summary: 'Schutting vervangen',
        confidence: 0.9
      };

      const breakdown = await generateWorkBreakdown(aiResult);

      const materialItems = breakdown.items.filter(i => i.line_type === 'materiaal');
      const laborItems = breakdown.items.filter(i => i.line_type === 'arbeid');

      expect(materialItems.length).toBeGreaterThan(0);
      expect(laborItems.length).toBeGreaterThan(0);
    });

    test('verwijderen action generates ONLY arbeid items (no new materials)', async () => {
      const aiResult: AIUnderstandingResult = {
        activities: [
          {
            type: 'bestrating',
            action: 'verwijderen',
            description: 'Bestaande tegels verwijderen en afvoeren',
            dimensions: { area: 30 },
            source_text: 'Tegels verwijderen 30m2',
            materials_mentioned: []
          }
        ],
        summary: 'Verwijderen werk',
        confidence: 0.9
      };

      const breakdown = await generateWorkBreakdown(aiResult);

      const materialItems = breakdown.items.filter(i => i.line_type === 'materiaal');
      const laborItems = breakdown.items.filter(i => i.line_type === 'arbeid');

      // Verwijderen is arbeid-only: no new materials needed for removal
      expect(materialItems).toHaveLength(0);
      expect(laborItems.length).toBeGreaterThan(0);
    });

    test('mixed herstraten and nieuw activities generate correct items', async () => {
      const aiResult: AIUnderstandingResult = {
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
            source_text: 'Uitbreiding 15m2 nieuwe tegels',
            materials_mentioned: ['tegels']
          }
        ],
        summary: 'Terras herstraten en uitbreiden',
        confidence: 0.9
      };

      const breakdown = await generateWorkBreakdown(aiResult);

      const herstratenItems = breakdown.items.filter(i => i.is_herstraten);
      const newItems = breakdown.items.filter(i => !i.is_herstraten);
      const materialItems = breakdown.items.filter(i => i.line_type === 'materiaal');

      // Herstraten activity: only arbeid
      expect(herstratenItems.length).toBeGreaterThan(0);
      expect(herstratenItems.every(i => i.line_type === 'arbeid')).toBe(true);

      // Nieuw activity: includes materials
      expect(newItems.length).toBeGreaterThan(0);
      expect(materialItems.length).toBeGreaterThan(0);
      expect(materialItems.every(i => !i.is_herstraten)).toBe(true);
    });
  });

  describe('Quantity Calculation Tests', () => {
    test('area dimensions (m2) calculate correctly', async () => {
      const aiResult: AIUnderstandingResult = {
        activities: [
          {
            type: 'bestrating',
            action: 'nieuw',
            description: 'Terras aanleggen',
            dimensions: { area: 40 },
            source_text: 'Terras 40m2',
            materials_mentioned: []
          }
        ],
        summary: 'Terras',
        confidence: 0.9
      };

      const breakdown = await generateWorkBreakdown(aiResult);
      const materialItem = breakdown.items.find(i => i.line_type === 'materiaal');

      expect(materialItem).toBeDefined();
      expect(materialItem!.quantity).toBe(40);
      expect(materialItem!.unit).toBe('m2');
    });

    test('length x width dimensions calculate area', async () => {
      const aiResult: AIUnderstandingResult = {
        activities: [
          {
            type: 'bestrating',
            action: 'nieuw',
            description: 'Terras aanleggen',
            dimensions: { length: 8, width: 12 },
            source_text: 'Terras 8x12m',
            materials_mentioned: []
          }
        ],
        summary: 'Terras',
        confidence: 0.9
      };

      const breakdown = await generateWorkBreakdown(aiResult);
      const materialItem = breakdown.items.find(i => i.line_type === 'materiaal');

      expect(materialItem).toBeDefined();
      expect(materialItem!.quantity).toBe(96); // 8 * 12
      expect(materialItem!.unit).toBe('m2');
    });

    test('linear dimensions (meter) calculate correctly', async () => {
      const aiResult: AIUnderstandingResult = {
        activities: [
          {
            type: 'erfafscheiding',
            action: 'nieuw',
            description: 'Schutting plaatsen',
            dimensions: { length: 20 },
            source_text: 'Schutting 20 meter',
            materials_mentioned: []
          }
        ],
        summary: 'Schutting',
        confidence: 0.9
      };

      const breakdown = await generateWorkBreakdown(aiResult);
      const materialItem = breakdown.items.find(i => i.line_type === 'materiaal');

      expect(materialItem).toBeDefined();
      expect(materialItem!.quantity).toBe(20);
      expect(materialItem!.unit).toBe('meter');
    });

    test('count dimensions (stuk) calculate correctly', async () => {
      const aiResult: AIUnderstandingResult = {
        activities: [
          {
            type: 'beplanting',
            action: 'nieuw',
            description: 'Bomen planten',
            dimensions: { count: 5 },
            source_text: '5 bomen',
            materials_mentioned: []
          }
        ],
        summary: 'Bomen planten',
        confidence: 0.9
      };

      const breakdown = await generateWorkBreakdown(aiResult);
      const materialItem = breakdown.items.find(i => i.line_type === 'materiaal');

      expect(materialItem).toBeDefined();
      expect(materialItem!.quantity).toBe(5);
      expect(materialItem!.unit).toBe('stuk');
    });

    test('missing dimensions default to 1', async () => {
      const aiResult: AIUnderstandingResult = {
        activities: [
          {
            type: 'overig',
            action: 'nieuw',
            description: 'Tuinmeubilair plaatsen',
            dimensions: {}, // No dimensions
            source_text: 'Tuinmeubilair',
            materials_mentioned: []
          }
        ],
        summary: 'Overig werk',
        confidence: 0.9
      };

      const breakdown = await generateWorkBreakdown(aiResult);
      const materialItem = breakdown.items.find(i => i.line_type === 'materiaal');

      expect(materialItem).toBeDefined();
      expect(materialItem!.quantity).toBe(1);
    });

    test('labor quantity calculated from area', async () => {
      const aiResult: AIUnderstandingResult = {
        activities: [
          {
            type: 'bestrating',
            action: 'nieuw',
            description: 'Terras aanleggen',
            dimensions: { area: 25 }, // Should generate ~5 hours (25/5)
            source_text: 'Terras 25m2',
            materials_mentioned: []
          }
        ],
        summary: 'Terras',
        confidence: 0.9
      };

      const breakdown = await generateWorkBreakdown(aiResult);
      const laborItem = breakdown.items.find(i => i.line_type === 'arbeid');

      expect(laborItem).toBeDefined();
      expect(laborItem!.quantity).toBeGreaterThan(0);
      expect(laborItem!.unit).toBe('uur');
    });
  });

  describe('Category Mapping Tests', () => {
    test('bestrating maps to m2 unit for materials', async () => {
      const aiResult: AIUnderstandingResult = {
        activities: [{
          type: 'bestrating',
          action: 'nieuw',
          description: 'Klinkers leggen',
          dimensions: { area: 30 },
          source_text: 'Klinkers 30m2',
          materials_mentioned: []
        }],
        summary: 'Bestrating',
        confidence: 0.9
      };

      const breakdown = await generateWorkBreakdown(aiResult);
      const materialItem = breakdown.items.find(i => i.line_type === 'materiaal');

      expect(materialItem!.category).toBe('bestrating');
      expect(materialItem!.unit).toBe('m2');
    });

    test('erfafscheiding maps to meter unit for materials', async () => {
      const aiResult: AIUnderstandingResult = {
        activities: [{
          type: 'erfafscheiding',
          action: 'nieuw',
          description: 'Schutting plaatsen',
          dimensions: { length: 15 },
          source_text: 'Schutting 15m',
          materials_mentioned: []
        }],
        summary: 'Erfafscheiding',
        confidence: 0.9
      };

      const breakdown = await generateWorkBreakdown(aiResult);
      const materialItem = breakdown.items.find(i => i.line_type === 'materiaal');

      expect(materialItem!.category).toBe('erfafscheiding');
      expect(materialItem!.unit).toBe('meter');
    });

    test('grondwerk maps to m3 unit for materials', async () => {
      const aiResult: AIUnderstandingResult = {
        activities: [{
          type: 'grondwerk',
          action: 'nieuw',
          description: 'Grond afgraven',
          dimensions: { area: 50, height: 0.3 },
          source_text: 'Grond afgraven 50m2 30cm diep',
          materials_mentioned: []
        }],
        summary: 'Grondwerk',
        confidence: 0.9
      };

      const breakdown = await generateWorkBreakdown(aiResult);
      const materialItem = breakdown.items.find(i => i.line_type === 'materiaal');

      expect(materialItem!.category).toBe('grondwerk');
      expect(materialItem!.unit).toBe('m3');
    });

    test('beplanting maps to stuk unit for materials', async () => {
      const aiResult: AIUnderstandingResult = {
        activities: [{
          type: 'beplanting',
          action: 'nieuw',
          description: 'Struiken planten',
          dimensions: { count: 10 },
          source_text: '10 struiken',
          materials_mentioned: []
        }],
        summary: 'Beplanting',
        confidence: 0.9
      };

      const breakdown = await generateWorkBreakdown(aiResult);
      const materialItem = breakdown.items.find(i => i.line_type === 'materiaal');

      expect(materialItem!.category).toBe('beplanting');
      expect(materialItem!.unit).toBe('stuk');
    });

    test('all work items have correct category assigned', async () => {
      const aiResult: AIUnderstandingResult = {
        activities: [
          {
            type: 'bestrating',
            action: 'nieuw',
            description: 'Terras',
            dimensions: { area: 30 },
            source_text: 'Terras 30m2',
            materials_mentioned: []
          },
          {
            type: 'erfafscheiding',
            action: 'nieuw',
            description: 'Schutting',
            dimensions: { length: 15 },
            source_text: 'Schutting 15m',
            materials_mentioned: []
          }
        ],
        summary: 'Mixed werk',
        confidence: 0.9
      };

      const breakdown = await generateWorkBreakdown(aiResult);

      const bestratingItems = breakdown.items.filter(i => i.category === 'bestrating');
      const erfafscheidingItems = breakdown.items.filter(i => i.category === 'erfafscheiding');

      expect(bestratingItems.length).toBeGreaterThan(0);
      expect(erfafscheidingItems.length).toBeGreaterThan(0);
    });
  });

  describe('Work Breakdown Generation', () => {
    test('generates summary with item counts', async () => {
      const aiResult: AIUnderstandingResult = {
        activities: [
          {
            type: 'bestrating',
            action: 'nieuw',
            description: 'Terras aanleggen',
            dimensions: { area: 40 },
            source_text: 'Terras 40m2',
            materials_mentioned: []
          }
        ],
        summary: 'Terras project',
        confidence: 0.9
      };

      const breakdown = await generateWorkBreakdown(aiResult);

      expect(breakdown.summary).toContain('items');
      expect(breakdown.summary).toContain('materiaal');
      expect(breakdown.summary).toContain('arbeid');
    });

    test('summary mentions herstraten when applicable', async () => {
      const aiResult: AIUnderstandingResult = {
        activities: [
          {
            type: 'bestrating',
            action: 'herstraten',
            description: 'Tegels herstraten',
            dimensions: { area: 40 },
            source_text: 'Herstraten 40m2',
            materials_mentioned: []
          }
        ],
        summary: 'Herstraten project',
        confidence: 0.9
      };

      const breakdown = await generateWorkBreakdown(aiResult);

      expect(breakdown.summary).toContain('herstraat');
    });

    test('validates output against WorkBreakdown schema', async () => {
      const aiResult: AIUnderstandingResult = {
        activities: [
          {
            type: 'bestrating',
            action: 'nieuw',
            description: 'Terras',
            dimensions: { area: 40 },
            source_text: 'Terras 40m2',
            materials_mentioned: []
          }
        ],
        summary: 'Terras',
        confidence: 0.9
      };

      // Should not throw - output should be valid
      await expect(generateWorkBreakdown(aiResult)).resolves.toBeDefined();
    });

    test('generates unique IDs for each work item', async () => {
      const aiResult: AIUnderstandingResult = {
        activities: [
          {
            type: 'bestrating',
            action: 'nieuw',
            description: 'Terras',
            dimensions: { area: 40 },
            source_text: 'Terras 40m2',
            materials_mentioned: []
          }
        ],
        summary: 'Terras',
        confidence: 0.9
      };

      const breakdown = await generateWorkBreakdown(aiResult);
      const ids = breakdown.items.map(i => i.id);
      const uniqueIds = new Set(ids);

      expect(ids.length).toBe(uniqueIds.size); // All IDs should be unique
    });
  });
});
