import { describe, it, expect } from 'vitest';
import { shouldPromptNewPricingItem } from '../new-pricing-item-prompt';

describe('shouldPromptNewPricingItem', () => {
  it('vraagt bij hernoemde regel die aan een bibliotheek-item hangt', () => {
    expect(
      shouldPromptNewPricingItem({
        description: 'Uitbreken straatwerk',
        pricingId: 'p-1',
        linkedItemName: 'Zandbed egaliseren + afreien',
        alreadyAsked: false
      })
    ).toBe(true);
  });

  it('vraagt niet als de omschrijving gelijk is aan het bibliotheek-item', () => {
    expect(
      shouldPromptNewPricingItem({
        description: 'Straatzand losgestoord',
        pricingId: 'p-1',
        linkedItemName: 'Straatzand losgestoord',
        alreadyAsked: false
      })
    ).toBe(false);
  });

  it('negeert hoofdletters en dubbele spaties bij het vergelijken', () => {
    expect(
      shouldPromptNewPricingItem({
        description: '  straatzand  LOSGESTOORD ',
        pricingId: 'p-1',
        linkedItemName: 'Straatzand losgestoord',
        alreadyAsked: false
      })
    ).toBe(false);
  });

  it('vraagt bij een losse regel zonder koppeling', () => {
    expect(
      shouldPromptNewPricingItem({
        description: 'Boomstronk frezen',
        pricingId: null,
        linkedItemName: null,
        alreadyAsked: false
      })
    ).toBe(true);
  });

  it('vraagt niet zolang een losse regel nog de placeholder-tekst heeft', () => {
    expect(
      shouldPromptNewPricingItem({
        description: 'Nieuw item',
        pricingId: null,
        linkedItemName: null,
        alreadyAsked: false
      })
    ).toBe(false);
  });

  it('vraagt niet bij een lege omschrijving', () => {
    expect(
      shouldPromptNewPricingItem({
        description: '   ',
        pricingId: null,
        linkedItemName: null,
        alreadyAsked: false
      })
    ).toBe(false);
  });

  it('vraagt niet opnieuw als er al gevraagd is voor deze omschrijving', () => {
    expect(
      shouldPromptNewPricingItem({
        description: 'Uitbreken straatwerk',
        pricingId: 'p-1',
        linkedItemName: 'Zandbed egaliseren + afreien',
        alreadyAsked: true
      })
    ).toBe(false);
  });

  it('vraagt niet als de koppeling niet opgezocht kan worden (bibliotheek niet geladen)', () => {
    expect(
      shouldPromptNewPricingItem({
        description: 'Uitbreken straatwerk',
        pricingId: 'p-1',
        linkedItemName: null,
        alreadyAsked: false
      })
    ).toBe(false);
  });
});
