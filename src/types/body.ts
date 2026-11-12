export type MeasureKey = 'cintura' | 'quadril' | 'braco' | 'coxa';

export const measureLabels: Record<MeasureKey, string> = {
  cintura: 'Cintura',
  quadril: 'Quadril',
  braco: 'Braço',
  coxa: 'Coxa',
};

export interface BodyEntry {
  id: string;
  date: string; // "2026-11-10"
  weightKg?: number;
  measures?: Partial<Record<MeasureKey, number>>; // cm
}
