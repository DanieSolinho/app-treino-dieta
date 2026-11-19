import { useMemo, useState, type FormEvent } from 'react';
import { useDietStore } from '../../stores/useDietStore';
import { normalizeName } from '../../lib/calories';
import { KCAL_PER_100, PROTEIN_PER_100 } from '../../data/kcalTable';
import { customNutrition, planFoodNames, setFoodNutrition } from '../../lib/foodNutrition';

const num = (t: string) => Number(t.replace(',', '.'));
const show = (n?: number) => (n === undefined ? '' : String(n).replace('.', ','));

/** Ajustes › Calorias dos alimentos: corrigir o valor de um alimento pelo rótulo. */
export function FoodNutritionCard() {
  const plan = useDietStore((s) => s.plan);
  const names = useMemo(() => planFoodNames(plan), [plan]);
  const [query, setQuery] = useState('');
  const [name, setName] = useState<string | null>(null);
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [saved, setSaved] = useState('');

  const q = normalizeName(query);
  const matches = q ? names.filter((n) => normalizeName(n).includes(q)).slice(0, 8) : [];
  const custom = name ? customNutrition(plan, name) : undefined;
  const valid = kcal.trim() !== '' && Number.isFinite(num(kcal)) && num(kcal) >= 0 && (protein.trim() === '' || (Number.isFinite(num(protein)) && num(protein) >= 0));

  function choose(n: string) {
    const c = customNutrition(plan, n);
    const key = normalizeName(n);
    setName(n);
    setKcal(show(c?.kcal ?? KCAL_PER_100[key]));
    setProtein(show(c?.protein ?? PROTEIN_PER_100[key]));
    setQuery('');
    setSaved('');
  }

  function save(e: FormEvent) {
    e.preventDefault();
    if (!name || !valid) return;
    const { setPlan } = useDietStore.getState();
    setPlan(setFoodNutrition(plan, name, { kcal: num(kcal), ...(protein.trim() ? { protein: num(protein) } : {}) }));
    setSaved(`${name}: salvo.`);
  }

  function reset() {
    if (!name) return;
    useDietStore.getState().setPlan(setFoodNutrition(plan, name, null));
    const key = normalizeName(name);
    setKcal(show(KCAL_PER_100[key]));
    setProtein(show(PROTEIN_PER_100[key]));
    setSaved(`${name}: voltou para a tabela.`);
  }

  return (
    <section className="card stack-sm" aria-labelledby="food-nutrition-title">
      <h2 id="food-nutrition-title" className="card__title">
        Calorias dos alimentos
      </h2>
      <p className="muted">Os valores vêm da tabela TACO. Se o rótulo do seu produto for diferente, corrija aqui (por 100 g ou 100 ml).</p>
      <label className="field">
        <span className="field__label">Alimento</span>
        <input className="input" type="search" placeholder="Ex.: queijo, pão, whey" value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      {matches.length > 0 && (
        <ul className="food-matches">
          {matches.map((n) => (
            <li key={n}>
              <button type="button" className="food-matches__btn" onClick={() => choose(n)}>
                {n}
              </button>
            </li>
          ))}
        </ul>
      )}

      {name && (
        <form className="stack-sm offplan__picked" onSubmit={save}>
          <p className="offplan__picked-name">{name}</p>
          <div className="food-nutrition__fields">
            <label className="field">
              <span className="field__label">kcal por 100 g</span>
              <input className="input" type="text" inputMode="decimal" value={kcal} onChange={(e) => setKcal(e.target.value)} />
            </label>
            <label className="field">
              <span className="field__label">Proteína (g) por 100 g</span>
              <input className="input" type="text" inputMode="decimal" value={protein} onChange={(e) => setProtein(e.target.value)} />
            </label>
          </div>
          <div className="row">
            {custom && (
              <button type="button" className="btn-sm btn-sm--outline" onClick={reset}>
                Voltar à tabela
              </button>
            )}
            <button type="submit" className="btn-sm btn-sm--dark" disabled={!valid}>
              Salvar
            </button>
          </div>
        </form>
      )}
      {saved && (
        <p className="muted" role="status">
          {saved}
        </p>
      )}
    </section>
  );
}
