/**
 * Email/password authentication backed by Supabase.
 *
 * The Supabase SDK is fetched lazily from a CDN the first time auth is actually
 * used. A deployment with no project configured never loads it, so the app keeps
 * working offline exactly as it did before cloud templates existed.
 */

import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from './supabase-config.js?v=100';

const SUPABASE_SDK_URL = 'https://esm.sh/@supabase/supabase-js@2';

let clientPromise = null;

/** Cached synchronously so callers can branch on sign-in state without awaiting. */
let currentUser = null;
const authListeners = new Set();

/**
 * @returns {boolean} True when this deployment has sign-in configured at all.
 */
export function isAuthAvailable() {
  return isSupabaseConfigured();
}

/**
 * Currently signed-in user, or null. Synchronous: reflects the last known state
 * after initAuth() has resolved.
 * @returns {object|null}
 */
export function getUser() {
  return currentUser;
}

/**
 * Subscribe to sign-in/sign-out. Returns an unsubscribe function.
 * @param {(user: object|null) => void} listener
 */
export function onAuthChange(listener) {
  authListeners.add(listener);
  return () => authListeners.delete(listener);
}

function notify() {
  authListeners.forEach((listener) => {
    try {
      listener(currentUser);
    } catch (e) {
      console.error('Auth listener failed:', e);
    }
  });
}

/**
 * Lazily create the Supabase client, loading the SDK on first use.
 * @returns {Promise<object>}
 */
export async function getClient() {
  if (!isSupabaseConfigured()) {
    throw new Error('Sign-in is not configured for this site.');
  }

  if (!clientPromise) {
    clientPromise = import(/* @vite-ignore */ SUPABASE_SDK_URL)
      .then(({ createClient }) => createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true },
      }))
      .catch((e) => {
        // Reset so a later attempt can retry rather than caching the failure.
        clientPromise = null;
        console.error('Supabase SDK load failed:', e);
        throw new Error('Could not load the sign-in library. Check your connection.');
      });
  }

  return clientPromise;
}

/**
 * Supabase reports an unreachable host as a bare "Failed to fetch", which tells
 * the user nothing about what to do. Anything else is already human-readable.
 * @param {Error} error
 * @returns {string}
 */
export function describeError(error) {
  const message = error?.message || 'Something went wrong.';
  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return 'Could not reach the server. Check your connection, and that SUPABASE_URL in supabase-config.js is correct.';
  }
  return message;
}

/**
 * Run a Supabase call and normalise its two failure modes — a thrown exception
 * (offline, bad host) and a returned `{ error }` (rejected credentials) — into
 * one readable Error.
 * @param {() => Promise<{ data?: any, error?: any }>} operation
 * @returns {Promise<any>} The call's `data`.
 */
export async function call(operation) {
  let result;
  try {
    result = await operation();
  } catch (e) {
    throw new Error(describeError(e));
  }

  if (result?.error) throw new Error(describeError(result.error));
  return result?.data;
}

/**
 * Restore any persisted session and start watching for auth changes.
 * Safe to call when sign-in is not configured — it simply does nothing.
 * @returns {Promise<object|null>} The restored user, if any.
 */
export async function initAuth() {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await getClient();
    const { data } = await supabase.auth.getSession();
    currentUser = data?.session?.user || null;

    supabase.auth.onAuthStateChange((_event, session) => {
      currentUser = session?.user || null;
      notify();
    });

    notify();
    return currentUser;
  } catch (e) {
    // A missing session or an offline CDN must not stop the editor from loading.
    console.error('Auth init failed:', e);
    return null;
  }
}

/**
 * Create an account. Depending on the project's settings Supabase may require
 * the address to be confirmed before the session becomes usable, so the caller
 * is told whether it still needs confirming.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: object|null, needsConfirmation: boolean }>}
 */
export async function signUp(email, password) {
  const supabase = await getClient();
  const data = await call(() => supabase.auth.signUp({ email, password }));

  currentUser = data.session?.user || null;
  notify();

  return {
    user: data.user || null,
    needsConfirmation: Boolean(data.user) && !data.session,
  };
}

/**
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>} The signed-in user.
 */
export async function signIn(email, password) {
  const supabase = await getClient();
  const data = await call(() => supabase.auth.signInWithPassword({ email, password }));

  currentUser = data.user;
  notify();
  return currentUser;
}

/**
 * Send a password reset email pointing back at this page.
 * @param {string} email
 */
export async function resetPassword(email) {
  const supabase = await getClient();
  await call(() => supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + window.location.pathname,
  }));
  return true;
}

export async function signOut() {
  const supabase = await getClient();
  await call(() => supabase.auth.signOut());

  currentUser = null;
  notify();
  return true;
}
