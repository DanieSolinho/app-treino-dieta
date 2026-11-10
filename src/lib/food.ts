import type { Food, Unit } from '../types/diet';

const unitLabel: Record<Unit, [string, string]> = {
  g: ['g', 'g'],
  ml: ['ml', 'ml'],
  un: ['unidade', 'unidades'],
  colher: ['colher de sopa', 'colheres de sopa'],
  fatia: ['fatia', 'fatias'],
  concha: ['concha', 'conchas'],
};

export function formatAmount({ amount, unit }: Food): string {
  const [one, many] = unitLabel[unit];
  if (unit === 'g' || unit === 'ml') return `${amount} ${one}`;
  return `${amount} ${amount === 1 ? one : many}`;
}

export function sameFood(a: Food, b: Food): boolean {
  return a.name === b.name && a.amount === b.amount && a.unit === b.unit;
}
