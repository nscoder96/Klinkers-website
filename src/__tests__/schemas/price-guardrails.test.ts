/**
 * Price Guardrails - Schema Structural Tests (AI-06)
 *
 * Purpose: These tests serve as guardrails against regression. While the schemas
 * currently have no price fields, these tests would BREAK if someone accidentally
 * added a price field to any schema.
 *
 * These tests verify:
 * 1. Schemas structurally cannot hold price data (inspecting .shape keys)
 * 2. Adding a price field to a valid object is REJECTED by the schema
 * 3. The TypeScript types derived from schemas have no price-related properties
 *
 * AI-06 requirement: "AI genereert NOOIT prijzen"
 */

import { describe, test, expect } from 'vitest';
import {
  ActivitySchema,
  AIUnderstandingResultSchema,
} from '@/lib/schemas/ai-understanding.schema';
import {
  WorkItemSchema,
  WorkBreakdownSchema,
} from '@/lib/schemas/work-breakdown.schema';

describe('Price Guardrails - Schema Structural Tests (AI-06)', () => {

  describe('Layer 1: AI Understanding Schema', () => {
    const PRICE_FIELD_NAMES = ['price', 'cost', 'tarief', 'prijs', 'unit_price', 'eenheidsprijs', 'total', 'totaal', 'subtotal', 'bedrag'];

    test('ActivitySchema has NO price-related fields in shape', () => {
      const shapeKeys = Object.keys(ActivitySchema.shape);
      for (const priceField of PRICE_FIELD_NAMES) {
        expect(shapeKeys).not.toContain(priceField);
      }
    });

    test('AIUnderstandingResultSchema has NO price-related fields in shape', () => {
      const shapeKeys = Object.keys(AIUnderstandingResultSchema.shape);
      for (const priceField of PRICE_FIELD_NAMES) {
        expect(shapeKeys).not.toContain(priceField);
      }
    });

    test('ActivitySchema.strict() rejects objects with extra price fields', () => {
      const activityWithPrice = {
        type: 'bestrating',
        action: 'nieuw',
        description: 'Test',
        dimensions: { area: 40 },
        source_text: 'Test',
        materials_mentioned: [],
        price: 500,
      };

      const result = ActivitySchema.strict().safeParse(activityWithPrice);
      expect(result.success).toBe(false);
    });

    test('ActivitySchema.strict() rejects objects with unit_price field', () => {
      const activityWithUnitPrice = {
        type: 'bestrating',
        action: 'nieuw',
        description: 'Test',
        dimensions: { area: 40 },
        source_text: 'Test',
        materials_mentioned: [],
        unit_price: 25.50,
      };

      const result = ActivitySchema.strict().safeParse(activityWithUnitPrice);
      expect(result.success).toBe(false);
    });

    test('ActivitySchema.strict() rejects objects with tarief field', () => {
      const activityWithTarief = {
        type: 'bestrating',
        action: 'nieuw',
        description: 'Test',
        dimensions: { area: 40 },
        source_text: 'Test',
        materials_mentioned: [],
        tarief: 45,
      };

      const result = ActivitySchema.strict().safeParse(activityWithTarief);
      expect(result.success).toBe(false);
    });
  });

  describe('Layer 2: Work Breakdown Schema', () => {
    const PRICE_FIELD_NAMES = ['price', 'cost', 'tarief', 'prijs', 'unit_price', 'eenheidsprijs', 'total', 'totaal', 'subtotal', 'bedrag', 'total_price'];

    test('WorkItemSchema has NO price-related fields in shape', () => {
      const shapeKeys = Object.keys(WorkItemSchema.shape);
      for (const priceField of PRICE_FIELD_NAMES) {
        expect(shapeKeys).not.toContain(priceField);
      }
    });

    test('WorkBreakdownSchema has NO price-related fields in shape', () => {
      const shapeKeys = Object.keys(WorkBreakdownSchema.shape);
      for (const priceField of PRICE_FIELD_NAMES) {
        expect(shapeKeys).not.toContain(priceField);
      }
    });

    test('WorkItemSchema.strict() rejects objects with price field', () => {
      const itemWithPrice = {
        id: crypto.randomUUID(),
        category: 'bestrating',
        description: 'Test',
        line_type: 'materiaal',
        quantity: 40,
        unit: 'm2',
        is_herstraten: false,
        price: 1000,
      };

      const result = WorkItemSchema.strict().safeParse(itemWithPrice);
      expect(result.success).toBe(false);
    });

    test('WorkItemSchema.strict() rejects objects with unit_price and total fields', () => {
      const itemWithPricing = {
        id: crypto.randomUUID(),
        category: 'bestrating',
        description: 'Test',
        line_type: 'materiaal',
        quantity: 40,
        unit: 'm2',
        is_herstraten: false,
        unit_price: 25,
        total: 1000,
      };

      const result = WorkItemSchema.strict().safeParse(itemWithPricing);
      expect(result.success).toBe(false);
    });
  });

  describe('Schema Allowed Fields (sanity check)', () => {
    test('ActivitySchema allows ONLY these fields: type, action, description, dimensions, source_text, materials_mentioned, missing_dimensions', () => {
      const allowedFields = ['type', 'action', 'description', 'dimensions', 'source_text', 'materials_mentioned', 'missing_dimensions'];
      const shapeKeys = Object.keys(ActivitySchema.shape);

      expect(shapeKeys.sort()).toEqual(allowedFields.sort());
    });

    test('WorkItemSchema allows ONLY these fields: id, category, description, line_type, quantity, unit, source_activity_id, is_herstraten', () => {
      const allowedFields = ['id', 'category', 'description', 'line_type', 'quantity', 'unit', 'source_activity_id', 'is_herstraten'];
      const shapeKeys = Object.keys(WorkItemSchema.shape);

      expect(shapeKeys.sort()).toEqual(allowedFields.sort());
    });
  });
});
