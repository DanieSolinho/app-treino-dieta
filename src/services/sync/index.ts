/** Ponto de entrada da sincronização para o resto do app. */
import { supabase } from '../supabase';
import { deleteAccount as deleteAccountRemote, signOut as signOutRemote, type Result } from '../auth';
import { createEngine, resetLocalData, useSyncMeta, useSyncStatus, type Engine } from './engine';
import { supabaseSyncApi } from './supabaseApi';
import { isDirty, pendingCount } from './types';
import { clearImageLinks, deleteMyImages, uploadBundledImages } from '../images';

export { useSyncMeta, useSyncStatus, pendingCount };

const engine: Engine | null = supabase ? createEngine(supabaseSyncApi(supabase)) : null;

/** Liga a sincronização e, em seguida, envia as fotos que este aparelho tem e a conta ainda não. */
export async function startSync(userId: string) {
  if (!engine) return;
  await engine.start(userId);
  void uploadBundledImages(userId).catch(() => {}); // sem internet: tenta na próxima abertura
}
export const stopSync = () => engine?.stop();
export const syncNow = () => engine?.syncNow({ pull: true }) ?? Promise.resolve(false);

/**
 * Sair: envia o que falta e só então limpa os dados deste aparelho
 * (assim outra pessoa que use o mesmo navegador não vê nada).
 */
export async function signOutAndClear(): Promise<Result> {
  if (engine && isDirty(useSyncMeta.getState().dirty)) {
    const ok = await engine.syncNow();
    if (!ok)
      return {
        ok: false,
        error: 'Há alterações que ainda não foram enviadas. Conecte-se à internet antes de sair, para não perdê-las.',
      };
  }
  const r = await signOutRemote();
  if (!r.ok) return r;
  engine?.stop();
  resetLocalData();
  clearImageLinks();
  return { ok: true };
}

export async function deleteAccountAndClear(): Promise<Result> {
  // as fotos ficam no armazenamento de arquivos, fora das tabelas: apaga antes da conta
  const photos = await deleteMyImages();
  if (!photos.ok) return photos;
  const r = await deleteAccountRemote();
  if (!r.ok) return r;
  engine?.stop();
  resetLocalData();
  clearImageLinks();
  return { ok: true };
}
