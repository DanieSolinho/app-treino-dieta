import { describe, expect, it } from 'vitest';
import { equivalentPortion, mainMacro, per100, type LabelReading, type ReferencePortion } from './labelMath';

// 1 fatia de pão integral (25 g) ≈ 62 kcal
const paoIntegral: ReferencePortion = {
  name: 'Pão de forma integral',
  grams: 25,
  nutrients: { kcal: 62, carbs: 12, protein: 2.5, fat: 0.9 },
};

const torrada: LabelReading = {
  foodName: 'Torrada integral',
  unit: 'g',
  basis: 'porcao',
  servingSize: 30,
  servingText: '3 torradas',
  nutrients: { kcal: 120, carbs: 21, protein: 4, fat: 2 },
  confidence: 'alta',
};

describe('equivalência pelo rótulo', () => {
  it('converte valores por porção para 100 g', () => {
    expect(per100(torrada)).toEqual({ kcal: 400, carbs: 70, protein: 13.3, fat: 6.7, fiber: undefined });
  });

  it('acha a quantidade com as mesmas calorias, arredondada a 5 g', () => {
    const eq = equivalentPortion(paoIntegral, torrada);
    expect(eq.grams).toBe(15); // 62 / 400 × 100 = 15,5 → 15 g
    expect(eq.servings).toBe(0.5); // metade da porção do rótulo
    expect(eq.nutrients.kcal).toBe(60);
    expect(eq.macroGap).toBeUndefined();
  });

  it('avisa quando o macro principal fica muito diferente', () => {
    // trocar pão (carboidrato) por pasta de amendoim (gordura) dá as mesmas kcal, mas pouco carboidrato
    const pasta: LabelReading = { ...torrada, foodName: 'Pasta de amendoim', basis: 'por100', servingSize: undefined, nutrients: { kcal: 600, carbs: 15, protein: 25, fat: 50 } };
    const eq = equivalentPortion(paoIntegral, pasta);
    expect(eq.grams).toBe(10);
    expect(eq.macroGap).toEqual({ macro: 'carbs', reference: 12, equivalent: 1.5 });
  });

  it('identifica o macro principal', () => {
    expect(mainMacro({ kcal: 165, carbs: 0, protein: 31, fat: 3.6 })).toBe('protein');
    expect(mainMacro(paoIntegral.nutrients)).toBe('carbs');
  });

  it('recusa leitura impossível', () => {
    expect(() => per100({ ...torrada, servingSize: undefined })).toThrow();
    expect(() => equivalentPortion(paoIntegral, { ...torrada, nutrients: { kcal: 0, carbs: 0, protein: 0, fat: 0 } })).toThrow();
  });
});
