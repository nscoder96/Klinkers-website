/**
 * AI Understanding Service Tests
 *
 * Tests for the AI Understanding layer (Layer 1) with mocked Anthropic SDK.
 * These tests verify:
 * - Schema validation works correctly
 * - The service correctly passes prompts to Claude
 * - The service correctly parses responses
 * - Dimension extraction from various formats
 * - Category classification
 *
 * IMPORTANT: These tests use mocked AI responses for speed and determinism.
 * They do NOT test the actual AI's behavior, only the service's handling of responses.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { analyzeNotes } from '@/lib/services/ai-understanding.service';
import { AIUnderstandingResultSchema, AIUnderstandingResult } from '@/lib/schemas/ai-understanding.schema';
import { DIMENSION_EXAMPLES, CATEGORY_EXAMPLES, EDGE_CASE_EXAMPLES } from '../fixtures/schouwnotities';

// Create a mock parse function that will be reused
const mockParse = vi.fn();

// Mock the Anthropic SDK
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

// Import after mocking to get the mocked version
import Anthropic from '@anthropic-ai/sdk';

describe('AI Understanding Service', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  describe('Schema Validation', () => {
    test('valid AI output passes schema validation', () => {
      const validOutput: AIUnderstandingResult = {
        activities: [
          {
            type: 'bestrating',
            action: 'nieuw',
            description: 'Nieuwe tegels leggen',
            dimensions: { area: 40 },
            source_text: 'Terras 40m2',
            materials_mentioned: ['tegels']
          }
        ],
        summary: 'Terras aanleggen',
        confidence: 0.9
      };

      const result = AIUnderstandingResultSchema.safeParse(validOutput);
      expect(result.success).toBe(true);
    });

    test('output with invalid type fields fails validation', () => {
      const invalidOutput = {
        activities: [
          {
            type: 'invalid_category', // Invalid category type
            action: 'nieuw',
            description: 'Nieuwe tegels leggen',
            dimensions: { area: 40 },
            source_text: 'Terras 40m2',
            materials_mentioned: ['tegels']
          }
        ],
        summary: 'Terras aanleggen',
        confidence: 0.9
      };

      const result = AIUnderstandingResultSchema.safeParse(invalidOutput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue =>
          issue.path.includes('type')
        )).toBe(true);
      }
    });

    test('missing required fields fail validation', () => {
      const invalidOutput = {
        activities: [
          {
            type: 'bestrating',
            // Missing 'action' field
            description: 'Nieuwe tegels leggen',
            dimensions: { area: 40 },
            source_text: 'Terras 40m2',
            materials_mentioned: ['tegels']
          }
        ],
        summary: 'Terras aanleggen',
        confidence: 0.9
      };

      const result = AIUnderstandingResultSchema.safeParse(invalidOutput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue =>
          issue.path.includes('action')
        )).toBe(true);
      }
    });

    test('confidence must be between 0 and 1', () => {
      const invalidOutput = {
        activities: [],
        summary: 'Test',
        confidence: 1.5 // Invalid: > 1
      };

      const result = AIUnderstandingResultSchema.safeParse(invalidOutput);
      expect(result.success).toBe(false);
    });
  });

  describe('Dimension Extraction - Area (m2)', () => {
    test('extracts area from m2 notation (AI-02)', async () => {
      const mockResponse: AIUnderstandingResult = {
        activities: [
          {
            type: 'bestrating',
            action: 'nieuw',
            description: 'Terras aanleggen',
            dimensions: { area: 40 },
            source_text: DIMENSION_EXAMPLES.area_m2,
            materials_mentioned: []
          }
        ],
        summary: 'Terras werk',
        confidence: 0.95
      };

      mockParse.mockResolvedValue({
        parsed_output: mockResponse
      });

      const result = await analyzeNotes(DIMENSION_EXAMPLES.area_m2);

      expect(result.activities).toHaveLength(1);
      expect(result.activities[0].dimensions.area).toBe(40);
    });

    test('extracts area from comma decimal notation', async () => {
      const mockResponse: AIUnderstandingResult = {
        activities: [
          {
            type: 'bestrating',
            action: 'nieuw',
            description: 'Tuin aanleggen',
            dimensions: { area: 15.5 },
            source_text: DIMENSION_EXAMPLES.area_comma,
            materials_mentioned: []
          }
        ],
        summary: 'Tuin werk',
        confidence: 0.9
      };

      mockParse.mockResolvedValue({
        parsed_output: mockResponse
      });

      const result = await analyzeNotes(DIMENSION_EXAMPLES.area_comma);

      expect(result.activities[0].dimensions.area).toBe(15.5);
    });
  });

  describe('Dimension Extraction - Length x Width (AI-02)', () => {
    test('extracts dimensions from LxW format', async () => {
      const mockResponse: AIUnderstandingResult = {
        activities: [
          {
            type: 'bestrating',
            action: 'nieuw',
            description: 'Voortuin aanleggen',
            dimensions: {
              length: 8,
              width: 12,
              area: 96 // Calculated from length x width
            },
            source_text: DIMENSION_EXAMPLES.length_width,
            materials_mentioned: []
          }
        ],
        summary: 'Voortuin werk',
        confidence: 0.9
      };

      mockParse.mockResolvedValue({
        parsed_output: mockResponse
      });

      const result = await analyzeNotes(DIMENSION_EXAMPLES.length_width);

      expect(result.activities[0].dimensions.length).toBe(8);
      expect(result.activities[0].dimensions.width).toBe(12);
      expect(result.activities[0].dimensions.area).toBe(96);
    });

    test('extracts dimensions from "bij" notation', async () => {
      const mockResponse: AIUnderstandingResult = {
        activities: [
          {
            type: 'bestrating',
            action: 'nieuw',
            description: 'Tuin aanleggen',
            dimensions: {
              length: 8,
              width: 12,
              area: 96
            },
            source_text: DIMENSION_EXAMPLES.length_bij,
            materials_mentioned: []
          }
        ],
        summary: 'Tuin werk',
        confidence: 0.9
      };

      mockParse.mockResolvedValue({
        parsed_output: mockResponse
      });

      const result = await analyzeNotes(DIMENSION_EXAMPLES.length_bij);

      expect(result.activities[0].dimensions.length).toBe(8);
      expect(result.activities[0].dimensions.width).toBe(12);
      expect(result.activities[0].dimensions.area).toBe(96);
    });
  });

  describe('Dimension Extraction - Linear Meters', () => {
    test('extracts linear meters from standard notation', async () => {
      const mockResponse: AIUnderstandingResult = {
        activities: [
          {
            type: 'erfafscheiding',
            action: 'nieuw',
            description: 'Schutting plaatsen',
            dimensions: { length: 20 },
            source_text: DIMENSION_EXAMPLES.linear_meters,
            materials_mentioned: ['schutting']
          }
        ],
        summary: 'Schutting werk',
        confidence: 0.95
      };

      mockParse.mockResolvedValue({
        parsed_output: mockResponse
      });

      const result = await analyzeNotes(DIMENSION_EXAMPLES.linear_meters);

      expect(result.activities[0].dimensions.length).toBe(20);
    });

    test('extracts linear meters from "strekkende meter" notation', async () => {
      const mockResponse: AIUnderstandingResult = {
        activities: [
          {
            type: 'bestrating',
            action: 'nieuw',
            description: 'Opsluitbanden plaatsen',
            dimensions: { length: 25 },
            source_text: DIMENSION_EXAMPLES.linear_strekkende,
            materials_mentioned: ['opsluitbanden']
          }
        ],
        summary: 'Opsluitbanden werk',
        confidence: 0.9
      };

      mockParse.mockResolvedValue({
        parsed_output: mockResponse
      });

      const result = await analyzeNotes(DIMENSION_EXAMPLES.linear_strekkende);

      expect(result.activities[0].dimensions.length).toBe(25);
    });
  });

  describe('Dimension Extraction - Count', () => {
    test('extracts count from number notation', async () => {
      const mockResponse: AIUnderstandingResult = {
        activities: [
          {
            type: 'beplanting',
            action: 'nieuw',
            description: 'Bomen planten',
            dimensions: { count: 3 },
            source_text: DIMENSION_EXAMPLES.count_number,
            materials_mentioned: ['bomen']
          }
        ],
        summary: 'Beplanting werk',
        confidence: 0.95
      };

      mockParse.mockResolvedValue({
        parsed_output: mockResponse
      });

      const result = await analyzeNotes(DIMENSION_EXAMPLES.count_number);

      expect(result.activities[0].dimensions.count).toBe(3);
    });

    test('extracts count from Dutch word notation', async () => {
      const mockResponse: AIUnderstandingResult = {
        activities: [
          {
            type: 'beplanting',
            action: 'nieuw',
            description: 'Struiken planten',
            dimensions: { count: 5 },
            source_text: DIMENSION_EXAMPLES.count_word,
            materials_mentioned: ['struiken']
          }
        ],
        summary: 'Beplanting werk',
        confidence: 0.9
      };

      mockParse.mockResolvedValue({
        parsed_output: mockResponse
      });

      const result = await analyzeNotes(DIMENSION_EXAMPLES.count_word);

      expect(result.activities[0].dimensions.count).toBe(5);
    });
  });

  describe('Dimension Extraction - Other Formats', () => {
    test('extracts cubic meters (volume)', async () => {
      const mockResponse: AIUnderstandingResult = {
        activities: [
          {
            type: 'grondwerk',
            action: 'verwijderen',
            description: 'Grond afvoeren',
            dimensions: { area: 5 }, // m3 stored as area for volume
            source_text: DIMENSION_EXAMPLES.cubic,
            materials_mentioned: ['grond']
          }
        ],
        summary: 'Grondwerk',
        confidence: 0.9
      };

      mockParse.mockResolvedValue({
        parsed_output: mockResponse
      });

      const result = await analyzeNotes(DIMENSION_EXAMPLES.cubic);

      expect(result.activities[0].type).toBe('grondwerk');
    });

    test('handles approximate range notation', async () => {
      const mockResponse: AIUnderstandingResult = {
        activities: [
          {
            type: 'bestrating',
            action: 'nieuw',
            description: 'Terras aanleggen',
            dimensions: { area: 37.5 }, // Average of range
            source_text: DIMENSION_EXAMPLES.approximate,
            materials_mentioned: []
          }
        ],
        summary: 'Terras werk',
        confidence: 0.8
      };

      mockParse.mockResolvedValue({
        parsed_output: mockResponse
      });

      const result = await analyzeNotes(DIMENSION_EXAMPLES.approximate);

      expect(result.activities[0].dimensions.area).toBeGreaterThanOrEqual(35);
      expect(result.activities[0].dimensions.area).toBeLessThanOrEqual(40);
    });
  });

  describe('Category Classification (AI-03)', () => {
    test('assigns work to grondwerk category', async () => {
      const mockResponse: AIUnderstandingResult = {
        activities: [
          {
            type: 'grondwerk',
            action: 'nieuw',
            description: 'Grond afgraven',
            dimensions: { area: 50, height: 0.2 },
            source_text: CATEGORY_EXAMPLES.grondwerk,
            materials_mentioned: []
          }
        ],
        summary: 'Grondwerk',
        confidence: 0.95
      };

      mockParse.mockResolvedValue({
        parsed_output: mockResponse
      });

      const result = await analyzeNotes(CATEGORY_EXAMPLES.grondwerk);

      expect(result.activities[0].type).toBe('grondwerk');
    });

    test('assigns work to bestrating category', async () => {
      const mockResponse: AIUnderstandingResult = {
        activities: [
          {
            type: 'bestrating',
            action: 'nieuw',
            description: 'Terras tegels leggen',
            dimensions: { area: 40 },
            source_text: CATEGORY_EXAMPLES.bestrating,
            materials_mentioned: ['tegels']
          }
        ],
        summary: 'Bestrating werk',
        confidence: 0.95
      };

      mockParse.mockResolvedValue({
        parsed_output: mockResponse
      });

      const result = await analyzeNotes(CATEGORY_EXAMPLES.bestrating);

      expect(result.activities[0].type).toBe('bestrating');
    });

    test('assigns work to erfafscheiding category', async () => {
      const mockResponse: AIUnderstandingResult = {
        activities: [
          {
            type: 'erfafscheiding',
            action: 'vervangen',
            description: 'Schutting vervangen',
            dimensions: { length: 12 },
            source_text: CATEGORY_EXAMPLES.erfafscheiding,
            materials_mentioned: ['schutting']
          }
        ],
        summary: 'Erfafscheiding werk',
        confidence: 0.95
      };

      mockParse.mockResolvedValue({
        parsed_output: mockResponse
      });

      const result = await analyzeNotes(CATEGORY_EXAMPLES.erfafscheiding);

      expect(result.activities[0].type).toBe('erfafscheiding');
    });

    test('assigns work to vlonders category', async () => {
      const mockResponse: AIUnderstandingResult = {
        activities: [
          {
            type: 'vlonders',
            action: 'nieuw',
            description: 'Houten vlonder aanleggen',
            dimensions: { length: 3, width: 4, area: 12 },
            source_text: CATEGORY_EXAMPLES.vlonders,
            materials_mentioned: ['hout']
          }
        ],
        summary: 'Vlonder werk',
        confidence: 0.95
      };

      mockParse.mockResolvedValue({
        parsed_output: mockResponse
      });

      const result = await analyzeNotes(CATEGORY_EXAMPLES.vlonders);

      expect(result.activities[0].type).toBe('vlonders');
    });

    test('assigns work to gazon category', async () => {
      const mockResponse: AIUnderstandingResult = {
        activities: [
          {
            type: 'gazon',
            action: 'nieuw',
            description: 'Gazon aanleggen met graszoden',
            dimensions: { area: 50 },
            source_text: CATEGORY_EXAMPLES.gazon,
            materials_mentioned: ['graszoden']
          }
        ],
        summary: 'Gazon werk',
        confidence: 0.95
      };

      mockParse.mockResolvedValue({
        parsed_output: mockResponse
      });

      const result = await analyzeNotes(CATEGORY_EXAMPLES.gazon);

      expect(result.activities[0].type).toBe('gazon');
    });

    test('assigns work to beplanting category', async () => {
      const mockResponse: AIUnderstandingResult = {
        activities: [
          {
            type: 'beplanting',
            action: 'nieuw',
            description: 'Haag en bomen planten',
            dimensions: { length: 15, count: 3 },
            source_text: CATEGORY_EXAMPLES.beplanting,
            materials_mentioned: ['haag', 'sierbomen']
          }
        ],
        summary: 'Beplanting werk',
        confidence: 0.95
      };

      mockParse.mockResolvedValue({
        parsed_output: mockResponse
      });

      const result = await analyzeNotes(CATEGORY_EXAMPLES.beplanting);

      expect(result.activities[0].type).toBe('beplanting');
    });

    test('assigns work to overkappingen category', async () => {
      const mockResponse: AIUnderstandingResult = {
        activities: [
          {
            type: 'overkappingen',
            action: 'nieuw',
            description: 'Pergola plaatsen',
            dimensions: { length: 4, width: 3, area: 12 },
            source_text: CATEGORY_EXAMPLES.overkappingen,
            materials_mentioned: ['pergola']
          }
        ],
        summary: 'Overkapping werk',
        confidence: 0.95
      };

      mockParse.mockResolvedValue({
        parsed_output: mockResponse
      });

      const result = await analyzeNotes(CATEGORY_EXAMPLES.overkappingen);

      expect(result.activities[0].type).toBe('overkappingen');
    });

    test('assigns work to waterwerken category', async () => {
      const mockResponse: AIUnderstandingResult = {
        activities: [
          {
            type: 'waterwerken',
            action: 'nieuw',
            description: 'Vijver aanleggen',
            dimensions: { length: 2, width: 3, area: 6 },
            source_text: CATEGORY_EXAMPLES.waterwerken,
            materials_mentioned: []
          }
        ],
        summary: 'Waterwerk',
        confidence: 0.95
      };

      mockParse.mockResolvedValue({
        parsed_output: mockResponse
      });

      const result = await analyzeNotes(CATEGORY_EXAMPLES.waterwerken);

      expect(result.activities[0].type).toBe('waterwerken');
    });

    test('assigns work to verlichting category', async () => {
      const mockResponse: AIUnderstandingResult = {
        activities: [
          {
            type: 'verlichting',
            action: 'nieuw',
            description: 'Tuinverlichting plaatsen',
            dimensions: { count: 8 },
            source_text: CATEGORY_EXAMPLES.verlichting,
            materials_mentioned: ['spots']
          }
        ],
        summary: 'Verlichting werk',
        confidence: 0.95
      };

      mockParse.mockResolvedValue({
        parsed_output: mockResponse
      });

      const result = await analyzeNotes(CATEGORY_EXAMPLES.verlichting);

      expect(result.activities[0].type).toBe('verlichting');
    });

    test('assigns work to overig category', async () => {
      const mockResponse: AIUnderstandingResult = {
        activities: [
          {
            type: 'overig',
            action: 'nieuw',
            description: 'Tuinmeubilair leveren en plaatsen',
            dimensions: {},
            source_text: CATEGORY_EXAMPLES.overig,
            materials_mentioned: ['tuinmeubilair']
          }
        ],
        summary: 'Overig werk',
        confidence: 0.9
      };

      mockParse.mockResolvedValue({
        parsed_output: mockResponse
      });

      const result = await analyzeNotes(CATEGORY_EXAMPLES.overig);

      expect(result.activities[0].type).toBe('overig');
    });
  });

  describe('Error Handling', () => {
    test('null parsed_output throws descriptive error', async () => {
      mockParse.mockResolvedValue({
        parsed_output: null
      });

      await expect(analyzeNotes('Test notes')).rejects.toThrow(
        'AI response was incomplete'
      );
    });

    test('API errors are propagated', async () => {
      mockParse.mockRejectedValue(new Error('API rate limit exceeded'));

      await expect(analyzeNotes('Test notes')).rejects.toThrow(
        'API rate limit exceeded'
      );
    });
  });

  describe('Service Integration', () => {
    test('service correctly passes notes to Claude', async () => {
      const testNotes = 'Terras 40m2 nieuwe tegels';

      const mockResponse: AIUnderstandingResult = {
        activities: [{
          type: 'bestrating',
          action: 'nieuw',
          description: 'Terras aanleggen',
          dimensions: { area: 40 },
          source_text: testNotes,
          materials_mentioned: ['tegels']
        }],
        summary: 'Terras werk',
        confidence: 0.9
      };

      mockParse.mockResolvedValue({
        parsed_output: mockResponse
      });

      await analyzeNotes(testNotes);

      // Verify parse was called with correct parameters
      expect(mockParse).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.any(String),
          system: expect.stringContaining('schouwnotities'),
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining(testNotes)
            })
          ])
        })
      );
    });

    test('service uses correct model version', async () => {
      const mockResponse: AIUnderstandingResult = {
        activities: [],
        summary: 'Test',
        confidence: 0.9
      };

      mockParse.mockResolvedValue({
        parsed_output: mockResponse
      });

      await analyzeNotes('Test notes');

      expect(mockParse).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-sonnet-4-6'
        })
      );
    });

    test('service enables structured outputs beta', async () => {
      const mockResponse: AIUnderstandingResult = {
        activities: [],
        summary: 'Test',
        confidence: 0.9
      };

      mockParse.mockResolvedValue({
        parsed_output: mockResponse
      });

      await analyzeNotes('Test notes');

      expect(mockParse).toHaveBeenCalledWith(
        expect.objectContaining({
          betas: expect.arrayContaining(['structured-outputs-2025-11-13'])
        })
      );
    });
  });

  describe('Edge Case Classification (AI-04)', () => {
    test('tegels rechtzetten classifies as repareren', async () => {
      const mockResponse: AIUnderstandingResult = {
        activities: [
          {
            type: 'bestrating',
            action: 'repareren',
            description: 'Tegels rechtzetten',
            dimensions: { area: 10 },
            source_text: EDGE_CASE_EXAMPLES.tegels_rechtzetten,
            materials_mentioned: ['tegels']
          }
        ],
        summary: 'Tegels rechtzetten',
        confidence: 0.9
      };

      mockParse.mockResolvedValue({
        parsed_output: mockResponse
      });

      const result = await analyzeNotes(EDGE_CASE_EXAMPLES.tegels_rechtzetten);

      expect(result.activities[0].action).toBe('repareren');
    });

    test('opnieuw voegen classifies as repareren', async () => {
      const mockResponse: AIUnderstandingResult = {
        activities: [
          {
            type: 'bestrating',
            action: 'repareren',
            description: 'Klinkers opnieuw voegen',
            dimensions: { area: 25 },
            source_text: EDGE_CASE_EXAMPLES.opnieuw_voegen,
            materials_mentioned: ['klinkers']
          }
        ],
        summary: 'Opnieuw voegen',
        confidence: 0.9
      };

      mockParse.mockResolvedValue({
        parsed_output: mockResponse
      });

      const result = await analyzeNotes(EDGE_CASE_EXAMPLES.opnieuw_voegen);

      expect(result.activities[0].action).toBe('repareren');
    });

    test('verzakte bestrating ophogen classifies as herstraten', async () => {
      const mockResponse: AIUnderstandingResult = {
        activities: [
          {
            type: 'bestrating',
            action: 'herstraten',
            description: 'Verzakte bestrating ophogen en opnieuw leggen',
            dimensions: { area: 15 },
            source_text: EDGE_CASE_EXAMPLES.verzakt_ophogen,
            materials_mentioned: ['bestrating']
          }
        ],
        summary: 'Bestrating herstraten',
        confidence: 0.9
      };

      mockParse.mockResolvedValue({
        parsed_output: mockResponse
      });

      const result = await analyzeNotes(EDGE_CASE_EXAMPLES.verzakt_ophogen);

      expect(result.activities[0].action).toBe('herstraten');
    });

    test('ander patroon classifies as herstraten', async () => {
      const mockResponse: AIUnderstandingResult = {
        activities: [
          {
            type: 'bestrating',
            action: 'herstraten',
            description: 'Bestaande klinkers in visgraatpatroon leggen',
            dimensions: { area: 30 },
            source_text: EDGE_CASE_EXAMPLES.ander_patroon,
            materials_mentioned: ['klinkers']
          }
        ],
        summary: 'Klinkers herstraten',
        confidence: 0.9
      };

      mockParse.mockResolvedValue({
        parsed_output: mockResponse
      });

      const result = await analyzeNotes(EDGE_CASE_EXAMPLES.ander_patroon);

      expect(result.activities[0].action).toBe('herstraten');
    });

    test('zelfde soort terug classifies as vervangen', async () => {
      const mockResponse: AIUnderstandingResult = {
        activities: [
          {
            type: 'bestrating',
            action: 'vervangen',
            description: 'Oude tegels eruit, zelfde soort terug',
            dimensions: { area: 20 },
            source_text: EDGE_CASE_EXAMPLES.zelfde_soort_terug,
            materials_mentioned: ['tegels']
          }
        ],
        summary: 'Tegels vervangen',
        confidence: 0.9
      };

      mockParse.mockResolvedValue({
        parsed_output: mockResponse
      });

      const result = await analyzeNotes(EDGE_CASE_EXAMPLES.zelfde_soort_terug);

      expect(result.activities[0].action).toBe('vervangen');
    });

    test('ander materiaal classifies as vervangen', async () => {
      const mockResponse: AIUnderstandingResult = {
        activities: [
          {
            type: 'bestrating',
            action: 'vervangen',
            description: 'Bestaande tegels eruit, nieuwe klinkers erin',
            dimensions: { area: 18 },
            source_text: EDGE_CASE_EXAMPLES.ander_materiaal,
            materials_mentioned: ['tegels', 'klinkers']
          }
        ],
        summary: 'Tegels vervangen door klinkers',
        confidence: 0.9
      };

      mockParse.mockResolvedValue({
        parsed_output: mockResponse
      });

      const result = await analyzeNotes(EDGE_CASE_EXAMPLES.ander_materiaal);

      expect(result.activities[0].action).toBe('vervangen');
    });

    test('alleen verwijderen classifies as verwijderen', async () => {
      const mockResponse: AIUnderstandingResult = {
        activities: [
          {
            type: 'erfafscheiding',
            action: 'verwijderen',
            description: 'Schutting afbreken en afvoeren',
            dimensions: { length: 8 },
            source_text: EDGE_CASE_EXAMPLES.alleen_verwijderen,
            materials_mentioned: ['schutting']
          }
        ],
        summary: 'Schutting verwijderen',
        confidence: 0.9
      };

      mockParse.mockResolvedValue({
        parsed_output: mockResponse
      });

      const result = await analyzeNotes(EDGE_CASE_EXAMPLES.alleen_verwijderen);

      expect(result.activities[0].action).toBe('verwijderen');
    });

    test('mixed input splits into herstraten + nieuw activities', async () => {
      const mockResponse: AIUnderstandingResult = {
        activities: [
          {
            type: 'bestrating',
            action: 'herstraten',
            description: 'Bestaand pad herstraten',
            dimensions: { area: 15 },
            source_text: 'Bestaand pad 15m2 herstraten',
            materials_mentioned: []
          },
          {
            type: 'bestrating',
            action: 'nieuw',
            description: 'Nieuw terras met keramische tegels',
            dimensions: { area: 20 },
            source_text: 'nieuw terras 20m2 met keramische tegels',
            materials_mentioned: ['keramische tegels']
          }
        ],
        summary: 'Pad herstraten en nieuw terras',
        confidence: 0.9
      };

      mockParse.mockResolvedValue({
        parsed_output: mockResponse
      });

      const result = await analyzeNotes(EDGE_CASE_EXAMPLES.mixed_herstraten_nieuw);

      expect(result.activities).toHaveLength(2);
      expect(result.activities[0].action).toBe('herstraten');
      expect(result.activities[1].action).toBe('nieuw');
    });

    test('mixed input splits into verwijderen + nieuw activities', async () => {
      const mockResponse: AIUnderstandingResult = {
        activities: [
          {
            type: 'erfafscheiding',
            action: 'verwijderen',
            description: 'Oude schutting verwijderen',
            dimensions: { length: 10 },
            source_text: 'Oude schutting 10m verwijderen',
            materials_mentioned: ['schutting']
          },
          {
            type: 'erfafscheiding',
            action: 'nieuw',
            description: 'Nieuwe schutting plaatsen',
            dimensions: { length: 12 },
            source_text: 'nieuwe schutting 12m plaatsen',
            materials_mentioned: ['schutting']
          }
        ],
        summary: 'Oude schutting verwijderen en nieuwe plaatsen',
        confidence: 0.9
      };

      mockParse.mockResolvedValue({
        parsed_output: mockResponse
      });

      const result = await analyzeNotes(EDGE_CASE_EXAMPLES.mixed_verwijderen_nieuw);

      expect(result.activities).toHaveLength(2);
      expect(result.activities[0].action).toBe('verwijderen');
      expect(result.activities[1].action).toBe('nieuw');
    });
  });
});
