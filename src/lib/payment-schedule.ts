const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Verdeelt een offertetotaal over termijnpercentages. Elke termijn wordt op
 * centen afgerond; de laatste termijn krijgt het restant zodat de som altijd
 * exact het totaal is (geen cent-verschil door afronding per termijn).
 */
export function computeScheduleAmounts(total: number, percentages: number[]): number[] {
  if (percentages.length === 0) return [];

  const amounts = percentages.map((pct) => round2((total * pct) / 100));
  const sumExceptLast = amounts
    .slice(0, -1)
    .reduce((sum, amount) => round2(sum + amount), 0);
  amounts[amounts.length - 1] = round2(total - sumExceptLast);
  return amounts;
}
