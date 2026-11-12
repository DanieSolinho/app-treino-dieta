import { useEffect, type ReactNode } from 'react';
import { startAuth, useAuth } from '../../services/auth';
import { startSync, stopSync, useSyncStatus } from '../../services/sync';
import { AuthPage } from './AuthPage';

interface Props {
  enabled: boolean; // false = sem Supabase configurado: mostra o app direto
  children: ReactNode;
}

/** Decide o que mostrar conforme a sessão: carregando, login, nova senha ou o app. */
export function AuthGate({ enabled, children }: Props) {
  const status = useAuth((s) => s.status);
  const userId = useAuth((s) => s.user?.id);
  const firstLoad = useSyncStatus((s) => s.firstLoad);

  useEffect(() => (enabled ? startAuth() : undefined), [enabled]);

  // logada: liga a sincronização da conta; ao sair, desliga
  useEffect(() => {
    if (!enabled || status !== 'logada' || !userId) return;
    void startSync(userId);
    return () => stopSync();
  }, [enabled, status, userId]);

  if (!enabled) return <>{children}</>;
  if (status === 'carregando') return <Loading text="Carregando…" />;
  if (status === 'nova-senha') return <AuthPage initialMode="nova-senha" />;
  if (status === 'deslogada') return <AuthPage />;
  if (firstLoad) return <Loading text="Sincronizando seus dados…" />;
  return <>{children}</>;
}

function Loading({ text }: { text: string }) {
  return (
    <main className="auth auth--loading" aria-busy="true">
      <span className="spinner" aria-hidden="true" />
      <p className="muted">{text}</p>
    </main>
  );
}
