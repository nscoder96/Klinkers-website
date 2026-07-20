import { describe, it, expect } from 'vitest';
import { computeScheduleAmounts } from '../payment-schedule';

describe('computeScheduleAmounts', () => {
  it('verdeelt 30/40/30 van €5.116,49 met de rest-cent in de laatste termijn', () => {
    expect(computeScheduleAmounts(5116.49, [30, 40, 30])).toEqual([1534.95, 2046.6, 1534.94]);
  });

  it('verdeelt 30/40/30 van €5.358,49 met de rest-cent in de laatste termijn', () => {
    expect(computeScheduleAmounts(5358.49, [30, 40, 30])).toEqual([1607.55, 2143.4, 1607.54]);
  });

  it('telt altijd exact op tot het totaal', () => {
    const totals = [5116.49, 5358.49, 999.99, 0.01, 12345.67];
    for (const total of totals) {
      const amounts = computeScheduleAmounts(total, [30, 40, 30]);
      const sum = Math.round(amounts.reduce((s, a) => s + a, 0) * 100) / 100;
      expect(sum).toBe(total);
    }
  });

  it('geeft bij één termijn van 100% het volledige totaal', () => {
    expect(computeScheduleAmounts(5116.49, [100])).toEqual([5116.49]);
  });

  it('geeft een lege lijst bij een leeg schema', () => {
    expect(computeScheduleAmounts(5116.49, [])).toEqual([]);
  });

  it('rondt tussentermijnen gewoon af (50/50 zonder rest)', () => {
    expect(computeScheduleAmounts(100, [50, 50])).toEqual([50, 50]);
  });
});
