export type Effort = 'facil' | 'ok' | 'dificil';

/**
 * dupla: mesma faixa em todas as séries; sobe a carga quando todas chegam ao topo.
 * piramide: cada série tem sua meta (12 → 10 → 8, subindo o peso); a sugestão olha a 1ª série.
 */
export type Progression = 'dupla' | 'piramide';

export interface Exercise {
  id: string;
  name: string;
  sets: number; // ex.: 4
  repMin: number; // faixa da série que decide a progressão
  repMax: number;
  restSeconds: number; // ex.: 90
  increment: number; // kg somados quando a sugestão manda subir
  currentLoad: number; // kg (0 = ainda não definida)
  progression?: Progression; // padrão: dupla
  setTargets?: string[]; // meta escrita de cada série, na ordem
  notes?: string; // observação geral (ex.: "20–30 s entre as pernas")
  bodyweight?: boolean; // sem carga para registrar (abdominais etc.)
  image?: string; // nome da foto em src/data/private/images (sem extensão)
}

/** Aparelhos de cardio. */
export type CardioMachine = 'esteira' | 'bike' | 'transport' | 'escada';

export const CARDIO_MACHINES: { id: CardioMachine; label: string }[] = [
  { id: 'esteira', label: 'Esteira' },
  { id: 'bike', label: 'Bike' },
  { id: 'transport', label: 'Transport' },
  { id: 'escada', label: 'Simulador de escada' },
];

export const machineLabel = (m?: string) => CARDIO_MACHINES.find((x) => x.id === m)?.label ?? 'Cardio';

/** Ficha "virtual" das sessões só de cardio (não aparece na lista de fichas). */
export const CARDIO_WORKOUT_ID = 'cardio';

/** Cardio opcional depois de um exercício ("treino híbrido"). */
export interface CardioBlock {
  afterExercise: number; // 1 = depois do 1º exercício
  minutes: number;
  intensity: 'intenso' | 'moderado';
  activity?: string; // padrão: corrida ou escada
}

export interface Workout {
  id: string;
  name: string; // "Treino A · Peito e tríceps"
  weekDays: number[]; // 0 = domingo … 6 = sábado (usado quando não há agenda por data)
  exercises: Exercise[];
  warmup?: string; // ativação + aquecimento
  stretchRoutineId?: string; // alongamento a fazer antes
  hybrid?: string; // observação geral sobre cardio
  cardio?: CardioBlock[];
  warmupImage?: string;
}

/** Agenda por data: "2026-11-10" -> ids das fichas do dia ([] = descanso). */
export type Schedule = Record<string, string[]>;

export interface SetLog {
  load: number;
  reps: number;
  effort?: Effort;
}

export type SuggestionAction = 'aumentar' | 'manter' | 'reduzir';

export interface Suggestion {
  action: SuggestionAction;
  load: number;
}

export interface WorkoutSession {
  id: string;
  workoutId: string;
  startedAt: string; // ISO
  finishedAt?: string; // ISO
  logs: Record<string, SetLog[]>; // exerciseId -> séries feitas
  suggestions?: Record<string, Suggestion>; // calculadas ao finalizar
  cardio?: Record<number, number>; // afterExercise -> minutos feitos (0 = pulou); 0 = cardio avulso
  cardioMachines?: Record<number, CardioMachine>; // afterExercise -> aparelho usado
}
