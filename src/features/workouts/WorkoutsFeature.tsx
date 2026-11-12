import { useState } from 'react';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { WorkoutList } from './WorkoutList';
import { WorkoutForm } from './WorkoutForm';
import { ActiveWorkout } from './ActiveWorkout';
import { SessionSummary } from './SessionSummary';
import { StretchPlayer } from './StretchPlayer';

type View =
  | { kind: 'list' }
  | { kind: 'edit'; id: string | null }
  | { kind: 'summary'; sessionId: string }
  | { kind: 'stretch'; routineId: string };

/** Navegação interna da aba Treinos. O treino em andamento tem prioridade sobre tudo. */
export function WorkoutsFeature() {
  const hasActive = useWorkoutStore((s) => s.active !== null);
  const stretchRoutines = useWorkoutStore((s) => s.stretches);
  const [view, setView] = useState<View>({ kind: 'list' });
  const back = () => setView({ kind: 'list' });

  if (hasActive) return <ActiveWorkout onFinished={(sessionId) => setView({ kind: 'summary', sessionId })} />;
  if (view.kind === 'edit') return <WorkoutForm workoutId={view.id} onDone={back} />;
  if (view.kind === 'summary') return <SessionSummary sessionId={view.sessionId} onClose={back} />;
  if (view.kind === 'stretch') {
    const routine = stretchRoutines.find((r) => r.id === view.routineId);
    if (routine) return <StretchPlayer routine={routine} onClose={back} />;
  }
  return (
    <WorkoutList
      onEdit={(id) => setView({ kind: 'edit', id })}
      onStretch={(routineId) => setView({ kind: 'stretch', routineId })}
    />
  );
}
