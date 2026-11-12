/**
 * Fotos dos exercícios e alongamentos.
 *
 * - No computador onde o app foi montado com src/data/private/images, usa a foto local.
 * - Em qualquer outro aparelho (celular), busca no armazenamento privado da conta
 *   (Supabase Storage, bucket "exercise-images", pasta = id da usuária) com um link
 *   temporário assinado. Ninguém mais consegue abrir essas fotos.
 */
import { useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from './supabase';
import { useAuth } from './auth';
import { bundledImageUrl, bundledImages } from '../data';

export const BUCKET = 'exercise-images';
const LINK_SECONDS = 7 * 24 * 3600; // o link vale 7 dias: o navegador reaproveita a foto em cache
const RENEW_BEFORE_MS = 24 * 3600 * 1000; // renova quando falta menos de 1 dia

export const imagePath = (userId: string, name: string) => `${userId}/${name}.webp`;

interface SignedLink {
  url: string;
  expiresAt: number; // ms
}

/** Links assinados guardados no aparelho, por conta. */
const useLinks = create<{ owner?: string; links: Record<string, SignedLink | null> }>()(
  persist(() => ({ links: {} }), { name: 'image-links' }),
);

export const needsRenewal = (link: SignedLink | null | undefined, now = Date.now()) =>
  link === undefined || (link !== null && link.expiresAt - now < RENEW_BEFORE_MS);

// junta os pedidos da tela inteira num só (createSignedUrls aceita vários de uma vez)
let queue = new Set<string>();
let flushing = false;

async function flush() {
  flushing = false;
  const userId = useAuth.getState().user?.id;
  const names = [...queue];
  queue = new Set();
  if (!supabase || !userId || names.length === 0) return;

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(
    names.map((n) => imagePath(userId, n)),
    LINK_SECONDS,
  );
  if (error || !data) return; // sem internet: tenta de novo na próxima vez que a tela pedir

  const expiresAt = Date.now() + LINK_SECONDS * 1000;
  const links: Record<string, SignedLink | null> = {};
  data.forEach((item, i) => {
    // foto que não existe na conta fica marcada como null para não pedir de novo a cada tela
    links[names[i]] = item.signedUrl ? { url: item.signedUrl, expiresAt } : null;
  });
  useLinks.setState((s) => ({ owner: userId, links: { ...(s.owner === userId ? s.links : {}), ...links } }));
}

function request(name: string) {
  queue.add(name);
  if (!flushing) {
    flushing = true;
    queueMicrotask(() => void flush());
  }
}

/** URL da foto para mostrar na tela (ou undefined se não houver). */
export function useImage(name?: string): string | undefined {
  const local = bundledImageUrl(name);
  const userId = useAuth((s) => s.user?.id);
  const link = useLinks((s) => (name && s.owner === userId ? s.links[name] : undefined));

  useEffect(() => {
    if (!local && name && userId && supabase && needsRenewal(link)) request(name);
  }, [local, name, userId, link]);

  return local ?? link?.url ?? undefined;
}

/**
 * Envia para a conta as fotos que vieram com o app neste computador e ainda não estão lá.
 * Roda depois de cada sincronização bem-sucedida; envia cada foto uma vez só.
 */
export async function uploadBundledImages(userId: string): Promise<number> {
  const local = bundledImages();
  if (!supabase || local.length === 0) return 0;

  const { data: remote, error } = await supabase.storage.from(BUCKET).list(userId, { limit: 1000 });
  if (error) return 0;
  const existing = new Set((remote ?? []).map((f) => f.name));

  let sent = 0;
  for (const img of local) {
    if (existing.has(`${img.name}.webp`)) continue;
    try {
      const blob = await (await fetch(img.url)).blob();
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(imagePath(userId, img.name), blob, { contentType: 'image/webp', upsert: false });
      if (!upErr) sent++;
    } catch {
      return sent; // sem internet: continua na próxima vez
    }
  }
  if (sent) useLinks.setState({ links: {} }); // fotos novas: pede os links de novo
  return sent;
}

/** Envia (ou troca) fotos vindas de um plano importado. Devolve quantas falharam. */
export async function uploadPlanImages(userId: string, images: { name: string; data: string }[]): Promise<number> {
  if (!supabase) return images.length;
  let failed = 0;
  for (const img of images) {
    const bytes = Uint8Array.from(atob(img.data), (c) => c.charCodeAt(0));
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(imagePath(userId, img.name), new Blob([bytes], { type: 'image/webp' }), { contentType: 'image/webp', upsert: true });
    if (error) failed++;
  }
  useLinks.setState({ links: {} }); // pede os links de novo (fotos novas ou trocadas)
  return failed;
}

/** Apaga todas as fotos da conta logada (usado ao excluir a conta). */
export async function deleteMyImages(): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = useAuth.getState().user?.id;
  if (!supabase || !userId) return { ok: true };
  const storage = supabase.storage.from(BUCKET);
  for (;;) {
    const { data, error } = await storage.list(userId, { limit: 1000 });
    if (error) return { ok: false, error: 'Não foi possível apagar as fotos. Verifique a internet e tente de novo.' };
    if (!data?.length) return { ok: true };
    const { error: rmErr } = await storage.remove(data.map((f) => `${userId}/${f.name}`));
    if (rmErr) return { ok: false, error: 'Não foi possível apagar as fotos. Verifique a internet e tente de novo.' };
  }
}

/** Ao sair da conta: esquece os links (são da conta anterior). */
export const clearImageLinks = () => useLinks.setState({ owner: undefined, links: {} });
