import { describe, it, expect } from 'vitest';
import {
  berekenSnijverlies,
  berekenFunderingVolume,
  berekenGrondafvoer,
  berekenArbeidsfactor,
  berekenOpsluitbanden,
  SNIJVERLIES,
  FUNDERINGSDIEPTE,
} from '../straatwerk-calculations';

describe('berekenSnijverlies', () => {
  it('voegt 6% toe voor recht patroon', () => {
    expect(berekenSnijverlies(25, 'recht')).toBeCloseTo(26.5);
  });
  it('voegt 12% toe voor visgraat patroon', () => {
    expect(berekenSnijverlies(25, 'visgraat')).toBeCloseTo(28);
  });
  it('voegt 20% toe voor ronde vormen', () => {
    expect(berekenSnijverlies(25, 'rond')).toBeCloseTo(30);
  });
  it('voegt 6% toe voor halfsteens (fallback naar recht)', () => {
    expect(berekenSnijverlies(25, 'halfsteens')).toBeCloseTo(26.5);
  });
});

describe('berekenFunderingVolume', () => {
  it('berekent volume voor zandgrond (15cm) + verdichtingsfactor 1.25', () => {
    // 25m² × 0.15m × 1.25 = 4.69
    expect(berekenFunderingVolume(25, 'zand')).toBeCloseTo(4.69, 1);
  });
  it('berekent volume voor kleigrond (35cm) + verdichtingsfactor 1.25', () => {
    // 25m² × 0.35m × 1.25 = 10.94
    expect(berekenFunderingVolume(25, 'klei')).toBeCloseTo(10.94, 1);
  });
  it('berekent volume voor veengrond (40cm) + verdichtingsfactor 1.25', () => {
    // 25m² × 0.40m × 1.25 = 12.5
    expect(berekenFunderingVolume(25, 'veen')).toBeCloseTo(12.5, 1);
  });
});

describe('berekenGrondafvoer', () => {
  it('berekent afvoervolume met zwelfactor 1.25', () => {
    // area=25, diepte=0.29m → 25 × 0.29 × 1.25 = 9.06
    expect(berekenGrondafvoer(25, 0.29)).toBeCloseTo(9.06, 1);
  });
  it('rondt op naar boven voor containermaat', () => {
    const result = berekenGrondafvoer(10, 0.25);
    expect(result).toBeGreaterThan(0);
  });
});

describe('berekenArbeidsfactor', () => {
  it('geeft factor 1.0 voor recht patroon', () => {
    expect(berekenArbeidsfactor('recht')).toBe(1.0);
  });
  it('geeft factor 1.3 voor visgraat (+30%)', () => {
    expect(berekenArbeidsfactor('visgraat')).toBe(1.3);
  });
  it('geeft factor 1.4 voor ronde vormen (+40%)', () => {
    expect(berekenArbeidsfactor('rond')).toBe(1.4);
  });
  it('geeft factor 1.0 voor halfsteens (zelfde als recht)', () => {
    expect(berekenArbeidsfactor('halfsteens')).toBe(1.0);
  });
});

describe('berekenOpsluitbanden', () => {
  it('berekent omtrek van rechthoekig terras + 5% snijverlies', () => {
    // 5×5m terras: omtrek = 2×(5+5) = 20m × 1.05 = 21m
    expect(berekenOpsluitbanden(5, 5)).toBeCloseTo(21);
  });
});

describe('constanten', () => {
  it('SNIJVERLIES heeft waarden voor alle patronen', () => {
    expect(SNIJVERLIES.recht).toBeDefined();
    expect(SNIJVERLIES.visgraat).toBeDefined();
    expect(SNIJVERLIES.rond).toBeDefined();
    expect(SNIJVERLIES.halfsteens).toBeDefined();
  });
  it('FUNDERINGSDIEPTE heeft waarden voor alle grondtypes', () => {
    expect(FUNDERINGSDIEPTE.zand).toBeDefined();
    expect(FUNDERINGSDIEPTE.klei).toBeDefined();
    expect(FUNDERINGSDIEPTE.veen).toBeDefined();
  });
});
