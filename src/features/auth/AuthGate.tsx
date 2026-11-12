import { useEffect, type ReactNode } from 'react';
import { startAuth, useAuth } from '../../services/auth';
import { AuthPage } from './AuthPage';

interface Props {
  enabled: boolean; // false = sem Supabase configurado: mostra o app direto
  children: ReactNode;
}

/** Decide o que mostrar conforme a sessão: carregando, login, nova senha ou o app. */
export function AuthGate({ enabled, children }: Props) {
  const status = useAuth((s) => s.status);

  useEffect(() => (enabled ? startAuth() : undefined), [enabled]);

  if (!enabled) return <>{children}</>;
  if (status === 'carregando') {
    return (
      <main className="auth auth--loading" aria-busy="true">
        <p className="muted">Carregando…</p>
      </main>
    );
  }
  if (status === 'nova-senha') return <AuthPage initialMode="nova-senha" />;
  if (status === 'deslogada') return <AuthPage />;
  return <>{children}</>;
}
