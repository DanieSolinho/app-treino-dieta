import type { Point } from '../../lib/progress';
import { formatShortDate } from '../../lib/progress';

interface Props {
  points: Point[];
  unit: string; // "kg", "cm"
  label: string; // descrição para leitor de tela
  color?: string;
  height?: number;
}

const W = 320;
const PAD = { top: 16, right: 12, bottom: 24, left: 36 };

const fmt = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

/** Gráfico de linha simples em SVG — sem biblioteca, escala pelo viewBox. */
export function LineChart({ points, unit, label, color = 'var(--brand)', height = 160 }: Props) {
  if (points.length === 0) return <p className="muted chart-empty">Nenhum registro ainda.</p>;

  const values = points.map((p) => p.value);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const pad = (max - min) * 0.15;
  min -= pad;
  max += pad;

  const innerW = W - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => PAD.top + (1 - (v - min) / (max - min)) * innerH;

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ');
  const ticks = [max - pad, (max + min) / 2, min + pad];
  const last = points.at(-1)!;

  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${W} ${height}`} role="img" aria-label={label}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--line)" />
            <text x={PAD.left - 6} y={y(t) + 4} textAnchor="end" fontSize="10" fill="var(--muted)">
              {fmt(t)}
            </text>
          </g>
        ))}
        <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={p.date + i} cx={x(i)} cy={y(p.value)} r={i === points.length - 1 ? 5 : 3} fill={i === points.length - 1 ? 'var(--lime)' : color} stroke={color} strokeWidth="2">
            <title>
              {formatShortDate(p.date)}: {fmt(p.value)} {unit}
            </title>
          </circle>
        ))}
        <text x={PAD.left} y={height - 6} fontSize="10" fill="var(--muted)">
          {formatShortDate(points[0].date)}
        </text>
        <text x={W - PAD.right} y={height - 6} fontSize="10" fill="var(--muted)" textAnchor="end">
          {formatShortDate(last.date)}
        </text>
      </svg>
    </figure>
  );
}
