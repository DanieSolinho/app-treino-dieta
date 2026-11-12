import { useState } from 'react';
import { DietPage } from './features/diet/DietPage';
import { TodayPage } from './features/today/TodayPage';
import { WorkoutsFeature } from './features/workouts/WorkoutsFeature';
import { ProgressPage } from './features/progress/ProgressPage';

type Tab = 'hoje' | 'treinos' | 'dieta' | 'progresso' | 'ajustes';

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'hoje', label: 'Hoje', icon: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z' },
  { id: 'treinos', label: 'Treinos', icon: 'M6 7v10M18 7v10M3 9.5v5M21 9.5v5M6 12h12' },
  {
    id: 'dieta',
    label: 'Dieta',
    icon: 'M12 21c-4 0-7-3-7-8 0-3 2-5 4.5-5 1.2 0 2 .5 2.5.5s1.3-.5 2.5-.5C17 8 19 10 19 13c0 5-3 8-7 8zM12 8.5c0-2 1-4 3-5',
  },
  { id: 'progresso', label: 'Progresso', icon: 'M4 19l5-6 4 3 7-9M20 7v4M20 7h-4' },
  { id: 'ajustes', label: 'Ajustes', icon: 'M4 7h9M17 7h3M4 17h3M11 17h9' },
];

function ComingSoon({ title }: { title: string }) {
  return (
    <main className="page">
      <h1 className="page__title">{title}</h1>
      <p className="muted">Essa tela entra nas próximas etapas do roadmap.</p>
    </main>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>('hoje');
  const current = tabs.find((t) => t.id === tab)!;

  return (
    <div className="app">
      {tab === 'hoje' && <TodayPage goTo={setTab} />}
      {tab === 'dieta' && <DietPage />}
      {tab === 'treinos' && <WorkoutsFeature />}
      {tab === 'progresso' && <ProgressPage />}
      {tab === 'ajustes' && <ComingSoon title={current.label} />}

      <nav className="nav" aria-label="Navegação principal">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`nav__item ${tab === t.id ? 'nav__item--active' : ''}`}
            aria-current={tab === t.id ? 'page' : undefined}
            onClick={() => setTab(t.id)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={t.icon} />
            </svg>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
