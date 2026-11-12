/**
 * Contas da equivalência de alimentos — compartilhadas entre o front-end e a função /api.
 * A IA só LÊ o rótulo e estima a porção de referência; a conta é sempre feita aqui, em código.
 */

export interface Nutrients {
  kcal: number;
  carbs: number; // g
  protein: number; // g
  fat: number; // g
  fiber?: number; // g
}

/** O que a IA leu do rótulo (ou estimou, no modo "alimento sem rótulo"). */
export interface LabelReading {
  foodName: string;
  unit: 'g' | 'ml';
  basis: 'por100' | 'porcao'; // os números abaixo são por 100 g/ml ou por porção do rótulo
  servingSize?: number; // g ou ml de 1 porção do rótulo
  servingText?: string; // "1 fatia", "2 biscoitos"
  nutrients: Nutrients;
  confidence: 'alta' | 'media' | 'baixa';
  notes?: string;
}

/** Porção do seu plano que será trocada, com valores estimados (tabela TACO). */
export interface ReferencePortion {
  name: string;
  grams: number;
  nutrients: Nutrients;
}

export type MainMacro = 'carbs' | 'protein' | 'fat';

export interface Equivalence {
  grams: number; // quanto comer do alimento novo
  servings?: number; // em porções do rótulo, quando ele informa
  nutrients: Nutrients; // o que essa quantidade fornece
  basis: 'kcal';
  macroGap?: { macro: MainMacro; reference: number; equivalent: number }; // aviso quando o macro principal destoa muito
}

const round = (n: number, step: number) => Math.round(n / step) * step;
const round1 = (n: number) => Math.round(n * 10) / 10;

export function scaleNutrients(n: Nutrients, factor: number): Nutrients {
  return {
    kcal: Math.round(n.kcal * factor),
    carbs: round1(n.carbs * factor),
    protein: round1(n.protein * factor),
    fat: round1(n.fat * factor),
    fiber: n.fiber === undefined ? undefined : round1(n.fiber * factor),
  };
}

/** Converte a leitura para valores por 100 g (ou 100 ml). */
export function per100(reading: LabelReading): Nutrients {
  if (reading.basis === 'por100') return reading.nutrients;
  if (!reading.servingSize || reading.servingSize <= 0) throw new Error('Rótulo por porção sem o tamanho da porção.');
  return scaleNutrients(reading.nutrients, 100 / reading.servingSize);
}

/** Macro que define o grupo da porção de referência (o que mais contribui em kcal). */
export function mainMacro(n: Nutrients): MainMacro {
  const kcal = { carbs: n.carbs * 4, protein: n.protein * 4, fat: n.fat * 9 };
  return (Object.keys(kcal) as MainMacro[]).reduce((a, b) => (kcal[b] > kcal[a] ? b : a));
}

/**
 * Quantidade do alimento novo com as MESMAS calorias da porção do plano
 * (é assim que as listas de substituição costumam ser montadas).
 * Arredonda para 5 g e avisa se o macro principal ficar muito diferente (±40%).
 */
export function equivalentPortion(reference: ReferencePortion, reading: LabelReading): Equivalence {
  const label = per100(reading);
  if (label.kcal <= 0) throw new Error('O rótulo precisa ter calorias maiores que zero.');

  const raw = (reference.nutrients.kcal / label.kcal) * 100;
  const grams = Math.max(5, round(raw, 5));
  const nutrients = scaleNutrients(label, grams / 100);

  const macro = mainMacro(reference.nutrients);
  const ref = reference.nutrients[macro];
  const eq = nutrients[macro];
  const macroGap = ref > 0 && Math.abs(eq - ref) / ref > 0.4 ? { macro, reference: round1(ref), equivalent: eq } : undefined;

  return {
    grams,
    servings: reading.servingSize ? round1(grams / reading.servingSize) : undefined,
    nutrients,
    basis: 'kcal',
    macroGap,
  };
}

export const macroLabel: Record<MainMacro, string> = { carbs: 'carboidratos', protein: 'proteínas', fat: 'gorduras' };
