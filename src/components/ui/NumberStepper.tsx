interface Props {
  label: string;
  /** Nome para leitores de tela, quando o rótulo visível não basta (ex.: "Carga · Bíceps na corda"). */
  name?: string;
  value: number;
  step: number;
  min?: number;
  format?: (n: number) => string;
  onChange: (n: number) => void;
}

const round = (n: number) => Math.round(n * 100) / 100;

export function NumberStepper({ label, name = label, value, step, min = 0, format = String, onChange }: Props) {
  return (
    <div className="stepper" role="group" aria-label={name}>
      <button
        type="button"
        className="stepper__btn"
        aria-label={`Diminuir ${name.toLowerCase()}`}
        disabled={value - step < min}
        onClick={() => onChange(round(Math.max(min, value - step)))}
      >
        −
      </button>
      <div className="stepper__value">
        <span className="stepper__label">{label}</span>
        <output aria-live="polite">{format(value)}</output>
      </div>
      <button
        type="button"
        className="stepper__btn"
        aria-label={`Aumentar ${name.toLowerCase()}`}
        onClick={() => onChange(round(value + step))}
      >
        +
      </button>
    </div>
  );
}
