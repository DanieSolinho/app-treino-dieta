import type { Workout } from '../types/workout';

/**
 * FICHAS DE EXEMPLO — troque pelas do seu personal (ou edite pelo próprio app).
 * As cargas são só ponto de partida.
 */
export const sampleWorkouts: Workout[] = [
  {
    id: 'treino-a',
    name: 'Treino A · Peito e tríceps',
    weekDays: [1, 4], // segunda e quinta
    exercises: [
      { id: 'a1', name: 'Supino reto com barra', sets: 4, repMin: 8, repMax: 12, restSeconds: 90, increment: 2.5, currentLoad: 30 },
      { id: 'a2', name: 'Supino inclinado com halteres', sets: 3, repMin: 8, repMax: 12, restSeconds: 90, increment: 2, currentLoad: 12 },
      { id: 'a3', name: 'Crucifixo na máquina', sets: 3, repMin: 10, repMax: 15, restSeconds: 60, increment: 5, currentLoad: 25 },
      { id: 'a4', name: 'Tríceps na polia', sets: 3, repMin: 10, repMax: 15, restSeconds: 60, increment: 2.5, currentLoad: 15 },
    ],
  },
  {
    id: 'treino-b',
    name: 'Treino B · Pernas',
    weekDays: [2, 5], // terça e sexta
    exercises: [
      { id: 'b1', name: 'Agachamento livre', sets: 4, repMin: 8, repMax: 12, restSeconds: 120, increment: 5, currentLoad: 40 },
      { id: 'b2', name: 'Leg press', sets: 4, repMin: 10, repMax: 15, restSeconds: 90, increment: 10, currentLoad: 120 },
      { id: 'b3', name: 'Cadeira extensora', sets: 3, repMin: 10, repMax: 15, restSeconds: 60, increment: 5, currentLoad: 30 },
      { id: 'b4', name: 'Elevação pélvica', sets: 3, repMin: 8, repMax: 12, restSeconds: 90, increment: 5, currentLoad: 50 },
    ],
  },
  {
    id: 'treino-c',
    name: 'Treino C · Costas e bíceps',
    weekDays: [3], // quarta
    exercises: [
      { id: 'c1', name: 'Puxada frontal', sets: 4, repMin: 8, repMax: 12, restSeconds: 90, increment: 5, currentLoad: 35 },
      { id: 'c2', name: 'Remada baixa', sets: 3, repMin: 8, repMax: 12, restSeconds: 90, increment: 5, currentLoad: 35 },
      { id: 'c3', name: 'Rosca direta', sets: 3, repMin: 10, repMax: 12, restSeconds: 60, increment: 2, currentLoad: 10 },
    ],
  },
];
