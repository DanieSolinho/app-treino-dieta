// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AuthGate } from './AuthGate';
import * as auth from '../../services/auth';

vi.mock('../../services/auth', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../services/auth')>();
  return {
    ...real,
    startAuth: vi.fn(() => () => {}),
    signIn: vi.fn(),
    signUp: vi.fn(),
    sendPasswordReset: vi.fn(),
    updatePassword: vi.fn(),
  };
});

const gate = () =>
  render(
    <AuthGate enabled>
      <p>Conteúdo do app</p>
    </AuthGate>,
  );
const type = (label: string | RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

beforeEach(() => auth.useAuth.setState({ status: 'deslogada', user: null }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Login', () => {
  it('sem Supabase configurado, mostra o app direto', () => {
    render(
      <AuthGate enabled={false}>
        <p>Conteúdo do app</p>
      </AuthGate>,
    );
    expect(screen.getByText('Conteúdo do app')).toBeTruthy();
  });

  it('deslogada vê a tela de entrar; logada vê o app', () => {
    gate();
    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeTruthy();
    expect(screen.queryByText('Conteúdo do app')).toBeNull();
    act(() => auth.useAuth.setState({ status: 'logada', user: { id: '1', email: 'dani@exemplo.com' } }));
    expect(screen.getByText('Conteúdo do app')).toBeTruthy();
  });

  it('entrar envia e-mail e senha e mostra o erro traduzido', async () => {
    vi.mocked(auth.signIn).mockResolvedValue({ ok: false, error: 'E-mail ou senha incorretos.' });
    gate();
    type('E-mail', 'dani@exemplo.com');
    type('Senha', 'senhaerrada1');
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect((await screen.findByRole('alert')).textContent).toBe('E-mail ou senha incorretos.');
    expect(auth.signIn).toHaveBeenCalledWith('dani@exemplo.com', 'senhaerrada1');
  });

  it('criar conta valida a senha antes de enviar', async () => {
    gate();
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    type('Como quer ser chamada?', 'Dani');
    type('E-mail', 'dani@exemplo.com');
    type('Senha', 'curta');
    type('Repita a senha', 'curta');
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    expect(screen.getByRole('alert').textContent).toBe('Use pelo menos 8 caracteres.');

    type('Senha', 'treino2026');
    type('Repita a senha', 'treino2027');
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    expect(screen.getByRole('alert').textContent).toBe('As senhas não são iguais.');
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it('criar conta pede para confirmar o e-mail e volta para entrar', async () => {
    vi.mocked(auth.signUp).mockResolvedValue({ ok: true, needsConfirmation: true });
    gate();
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    type('Como quer ser chamada?', 'Dani');
    type('E-mail', ' dani@exemplo.com ');
    type('Senha', 'treino2026');
    type('Repita a senha', 'treino2026');
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect((await screen.findByRole('status')).textContent).toContain('link de confirmação para dani@exemplo.com');
    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeTruthy();
    expect(auth.signUp).toHaveBeenCalledWith('dani@exemplo.com', 'treino2026', 'Dani');
  });

  it('esqueci a senha envia o link sem revelar se a conta existe', async () => {
    vi.mocked(auth.sendPasswordReset).mockResolvedValue({ ok: true });
    gate();
    fireEvent.click(screen.getByRole('button', { name: 'Esqueci minha senha' }));
    type('E-mail', 'dani@exemplo.com');
    fireEvent.click(screen.getByRole('button', { name: 'Enviar link' }));
    expect((await screen.findByRole('status')).textContent).toContain('Se existir uma conta com dani@exemplo.com');
  });

  it('o link de nova senha abre a tela de nova senha', async () => {
    vi.mocked(auth.updatePassword).mockResolvedValue({ ok: true });
    auth.useAuth.setState({ status: 'nova-senha', user: { id: '1', email: 'dani@exemplo.com' } });
    gate();
    expect(screen.getByRole('heading', { name: 'Nova senha' })).toBeTruthy();
    type('Nova senha', 'novasenha9');
    type('Repita a senha', 'novasenha9');
    fireEvent.click(screen.getByRole('button', { name: 'Salvar nova senha' }));
    await vi.waitFor(() => expect(auth.updatePassword).toHaveBeenCalledWith('novasenha9'));
  });
});

describe('mensagens de erro', () => {
  it('traduz pelos códigos do Supabase', () => {
    expect(auth.translateError({ code: 'invalid_credentials', message: 'Invalid login credentials' })).toBe('E-mail ou senha incorretos.');
    expect(auth.translateError({ code: 'email_not_confirmed', message: '' })).toContain('Confirme seu e-mail');
    expect(auth.translateError({ code: undefined, message: 'Failed to fetch' })).toContain('Sem conexão');
    expect(auth.translateError({ code: 'algo_novo', message: 'x' })).toBe('Algo deu errado. Tente de novo.');
  });

  it('regra de senha', () => {
    expect(auth.passwordProblem('abc12')).toBe('Use pelo menos 8 caracteres.');
    expect(auth.passwordProblem('sóletrasaqui')).toBe('Misture letras e números.');
    expect(auth.passwordProblem('treino2026')).toBeNull();
  });
});
