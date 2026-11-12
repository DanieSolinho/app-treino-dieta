/**
 * Login com e-mail e senha.
 * As telas usam só estas funções e o hook useAuth — nunca o Supabase direto.
 */
import { create } from 'zustand';
import type { AuthError } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
}

export type AuthStatus =
  | 'carregando' // lendo a sessão salva
  | 'deslogada'
  | 'logada'
  | 'nova-senha' // chegou pelo link de "esqueci minha senha"
  | 'demo'; // modo demonstração, sem conta (services/demo.ts)

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
}

export const useAuth = create<AuthState>(() => ({ status: 'carregando', user: null }));

/** Marca, no aparelho, que a demonstração está aberta (sobrevive a recarregar a página). */
export const DEMO_KEY = 'demo-mode';
const demoOpen = () => {
  try {
    return localStorage.getItem(DEMO_KEY) === '1';
  } catch {
    return false;
  }
};

/** Resultado de cada ação: ok, ou a mensagem pronta para mostrar na tela. */
export type Result = { ok: true } | { ok: false; error: string };

const messages: Record<string, string> = {
  invalid_credentials: 'E-mail ou senha incorretos.',
  email_not_confirmed: 'Confirme seu e-mail antes de entrar: abra o link que enviamos.',
  user_already_exists: 'Já existe uma conta com esse e-mail. Tente entrar.',
  email_exists: 'Já existe uma conta com esse e-mail. Tente entrar.',
  weak_password: 'Senha fraca. Use pelo menos 8 caracteres, misturando letras e números.',
  same_password: 'A nova senha precisa ser diferente da atual.',
  email_address_invalid: 'Esse e-mail não parece válido.',
  over_email_send_rate_limit: 'Muitos e-mails enviados em pouco tempo. Espere alguns minutos e tente de novo.',
  over_request_rate_limit: 'Muitas tentativas seguidas. Espere um pouco e tente de novo.',
  otp_expired: 'O link expirou. Peça um novo.',
};

export function translateError(error: Pick<AuthError, 'code' | 'message'> | null | undefined): string {
  if (!error) return 'Algo deu errado. Tente de novo.';
  if (error.code && messages[error.code]) return messages[error.code];
  if (/fetch|network/i.test(error.message)) return 'Sem conexão. Confira a internet e tente de novo.';
  return 'Algo deu errado. Tente de novo.';
}

const toUser = (u: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null | undefined): AuthUser | null =>
  u ? { id: u.id, email: u.email ?? '', displayName: (u.user_metadata?.display_name as string | undefined) || undefined } : null;

const notConfigured: Result = { ok: false, error: 'Login não configurado neste aparelho.' };
const fail = (e: unknown): Result => ({ ok: false, error: translateError(e as AuthError) });

/** Onde os links dos e-mails (confirmação, nova senha) devem abrir. */
const appUrl = () => window.location.origin + window.location.pathname;

let started = false;

/** Lê a sessão salva e passa a ouvir entradas, saídas e o link de nova senha. Chamar uma vez. */
export function startAuth(): () => void {
  if (!supabase || started) return () => {};
  started = true;
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    const user = toUser(session?.user);
    if (event === 'PASSWORD_RECOVERY') useAuth.setState({ status: 'nova-senha', user });
    else if (useAuth.getState().status === 'nova-senha' && session) useAuth.setState({ user }); // segue na tela de nova senha
    else if (session) {
      try {
        localStorage.removeItem(DEMO_KEY);
      } catch {
        /* ignora */
      }
      useAuth.setState({ status: 'logada', user });
    }
    else useAuth.setState({ status: demoOpen() || useAuth.getState().status === 'demo' ? 'demo' : 'deslogada', user: null });
  });
  return () => {
    data.subscription.unsubscribe();
    started = false;
  };
}

export async function signIn(email: string, password: string): Promise<Result> {
  if (!supabase) return notConfigured;
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  return error ? fail(error) : { ok: true };
}

/** Cria a conta. Com confirmação de e-mail ligada, a pessoa só entra depois de clicar no link. */
export async function signUp(email: string, password: string, displayName: string): Promise<Result & { needsConfirmation?: boolean }> {
  if (!supabase) return notConfigured;
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { display_name: displayName.trim() }, emailRedirectTo: appUrl() },
  });
  if (error) return fail(error);
  return { ok: true, needsConfirmation: !data.session };
}

export async function sendPasswordReset(email: string): Promise<Result> {
  if (!supabase) return notConfigured;
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: appUrl() });
  return error ? fail(error) : { ok: true };
}

export async function updatePassword(password: string): Promise<Result> {
  if (!supabase) return notConfigured;
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return fail(error);
  useAuth.setState({ status: 'logada' });
  return { ok: true };
}

export async function signOut(): Promise<Result> {
  if (!supabase) return notConfigured;
  const { error } = await supabase.auth.signOut();
  if (error) return fail(error);
  useAuth.setState({ status: 'deslogada', user: null });
  return { ok: true };
}

/** RGPD: apaga a conta e todos os dados no servidor. */
export async function deleteAccount(): Promise<Result> {
  if (!supabase) return notConfigured;
  const { error } = await supabase.rpc('delete_my_account');
  if (error) return { ok: false, error: 'Não consegui apagar a conta agora. Tente de novo.' };
  await supabase.auth.signOut({ scope: 'local' });
  useAuth.setState({ status: 'deslogada', user: null });
  return { ok: true };
}

/** Regra de senha da tela (o servidor exige no mínimo 6; aqui pedimos mais). */
export function passwordProblem(password: string): string | null {
  if (password.length < 8) return 'Use pelo menos 8 caracteres.';
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) return 'Misture letras e números.';
  return null;
}
