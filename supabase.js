import { createClient } from '@supabase/supabase-js';

// Vercel Environment Variables. Supports the current publishable key name
// and the older anon key name. Never use a service_role/secret key in browser code.
const url = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '');
const key = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  ''
).trim();

export const isSupabaseConfigured = Boolean(
  url.startsWith('https://') &&
  url.includes('.supabase.co') &&
  key &&
  !key.includes('PROJECT-ID') &&
  !key.includes('PASTE_PUBLIC_KEY') &&
  !key.includes('PASTE_YOUR')
);

export const supabase = isSupabaseConfigured ? createClient(url, key) : null;
