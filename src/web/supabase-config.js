/**
 * Supabase project settings for Phomymo sign-in and cloud templates.
 *
 * Fill these in with the values from your Supabase project
 * (Dashboard -> Project Settings -> API). Both are safe to commit: the anon key
 * is a public client key, and Row Level Security is what actually protects each
 * user's rows. See the "Cloud templates" section of README.md for setup.
 *
 * Leave them empty to keep Phomymo fully offline — the app then behaves exactly
 * as it did before, saving designs to browser storage only.
 */

export const SUPABASE_URL = '';
export const SUPABASE_ANON_KEY = '';

/**
 * @returns {boolean} True when this deployment has a Supabase project wired up.
 */
export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
