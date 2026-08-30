/**
 * Cloud persistence for label designs, backed by a Supabase `designs` table.
 *
 * Mirrors the API of storage.js so the two are interchangeable behind
 * template-store.js. Every function here is async and requires a signed-in user;
 * Row Level Security scopes all reads and writes to that user's own rows.
 */

import { getClient, call } from './auth.js?v=100';

const TABLE = 'designs';

/**
 * Project a stored row into the same metadata shape listDesigns() returns
 * locally, so the load dialog can render either source without branching.
 */
function toMetadata(row) {
  const design = row.data || {};
  return {
    name: row.name,
    savedAt: row.updated_at ? new Date(row.updated_at).getTime() : 0,
    labelSize: design.labelSize || { width: 40, height: 30 },
    elementCount: design.elements?.length || 0,
    isTemplate: design.isTemplate || false,
    templateFieldCount: design.templateFields?.length || 0,
    templateDataCount: design.templateData?.length || 0,
    hasImages: design.elements?.some(el => el.type === 'image') || false,
    isMultiLabel: design.multiLabel?.enabled || false,
    multiLabel: design.multiLabel || null,
  };
}

/**
 * Insert or replace a design for the given user.
 * @param {string} name - Design name (unique per user)
 * @param {object} design - { elements, labelSize, ... }
 * @param {string} userId
 */
export async function saveDesign(name, design, userId) {
  if (!name || !name.trim()) {
    throw new Error('Design name is required');
  }

  const supabase = await getClient();
  await call(() => supabase
    .from(TABLE)
    .upsert({
      user_id: userId,
      name: name.trim(),
      data: design,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,name' }));

  return true;
}

/**
 * @param {string} name
 * @param {string} userId
 * @returns {Promise<object|null>} The stored design, or null when absent.
 */
export async function loadDesign(name, userId) {
  const supabase = await getClient();
  const row = await call(() => supabase
    .from(TABLE)
    .select('data')
    .eq('user_id', userId)
    .eq('name', name)
    .maybeSingle());

  return row?.data || null;
}

/**
 * @param {string} userId
 * @returns {Promise<Array>} Design metadata, most recently saved first.
 */
export async function listDesigns(userId) {
  const supabase = await getClient();
  const rows = await call(() => supabase
    .from(TABLE)
    .select('name, data, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false }));

  return (rows || []).map(toMetadata);
}

/**
 * @param {string} name
 * @param {string} userId
 */
export async function deleteDesign(name, userId) {
  const supabase = await getClient();
  await call(() => supabase
    .from(TABLE)
    .delete()
    .eq('user_id', userId)
    .eq('name', name));

  return true;
}

/**
 * Names already stored for this user, used to detect collisions before an upload.
 * @param {string} userId
 * @returns {Promise<Set<string>>}
 */
export async function listDesignNames(userId) {
  const supabase = await getClient();
  const rows = await call(() => supabase
    .from(TABLE)
    .select('name')
    .eq('user_id', userId));

  return new Set((rows || []).map(row => row.name));
}
