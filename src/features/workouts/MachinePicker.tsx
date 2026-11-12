import { CARDIO_MACHINES, type CardioMachine } from '../../types/workout';

/** Ícones simples de cada aparelho. */
const ICONS: Record<CardioMachine, string> = {
  esteira: 'M3 18h15l3-4M6 18l-1 2M17 18l1 2M13 5.5a1.5 1.5 0 1 0 0-.01M12 8l-3 3 3 2-1 4M12 8l3 2 2-1',
  bike: 'M6 17a3 3 0 1 0 0-.01M18 17a3 3 0 1 0 0-.01M6 17l4-7h5l3 7M10 10l-1-3H7M15 10l1-3h2',
  transport: 'M7 21l3-9 4 3 3 6M10 12l2-6M14 4a1.5 1.5 0 1 0 0-.01M5 21h14M8 9l4-3 4 2',
  escada: 'M4 20h4v-4h4v-4h4V8h4M4 20V16M8 16v-4M12 12V8M16 8V4',
};

export function MachineIcon({ machine, size = 22 }: { machine: CardioMachine; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[machine]} />
    </svg>
  );
}

const KEY = 'cardio-machine';
export const lastMachine = (): CardioMachine => {
  try {
    const m = localStorage.getItem(KEY);
    if (CARDIO_MACHINES.some((x) => x.id === m)) return m as CardioMachine;
  } catch {
    /* sem armazenamento */
  }
  return 'esteira';
};
export const rememberMachine = (m: CardioMachine) => {
  try {
    localStorage.setItem(KEY, m);
  } catch {
    /* ignora */
  }
};

interface Props {
  value: CardioMachine;
  onChange: (m: CardioMachine) => void;
  dark?: boolean;
}

export function MachinePicker({ value, onChange, dark = false }: Props) {
  return (
    <div className={`machines ${dark ? 'machines--dark' : ''}`} role="radiogroup" aria-label="Aparelho">
      {CARDIO_MACHINES.map((m) => (
        <button
          key={m.id}
          type="button"
          role="radio"
          aria-checked={value === m.id}
          className={`machine ${value === m.id ? 'machine--on' : ''}`}
          onClick={() => onChange(m.id)}
        >
          <MachineIcon machine={m.id} />
          <span>{m.label}</span>
        </button>
      ))}
    </div>
  );
}
