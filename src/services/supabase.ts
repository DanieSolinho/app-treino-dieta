/**
 * Único ponto do app que conhece o Supabase.
 * As telas nunca importam daqui direto: usam os serviços desta pasta (auth, sync…).
 * Se um dia o banco mudar para outro Postgres, só esta pasta muda.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

/**
 * null quando o .env não tem as variáveis: o app continua funcionando só no aparelho,
 * como antes (útil para testes e para quem clonar o repositório).
 */
export const supabase: SupabaseClient<Database> | null =
  url && key
    ? createClient<Database>(url, key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      })
    : null;

export const cloudEnabled = supabase !== null;
