/**
 * Single entry point the editor uses to persist designs.
 *
 * Routes to Supabase while somebody is signed in and to browser storage
 * otherwise, so the offline experience is unchanged for anyone who never logs
 * in. Every export is async because the cloud path has to be.
 */

import * as local from './storage.js?v=100';
import * as cloud from './cloud-storage.js?v=100';
import { getUser } from './auth.js?v=100';

/**
 * @returns {boolean} True when saves are currently going to the cloud.
 */
export function isCloudActive() {
  return Boolean(getUser());
}

/**
 * Where the next save will land, for display in the UI.
 * @returns {'cloud'|'local'}
 */
export function activeStore() {
  return isCloudActive() ? 'cloud' : 'local';
}

/**
 * @param {string} name
 * @param {object} design - { elements, labelSize, ... }
 */
export async function saveDesign(name, design) {
  const user = getUser();
  if (user) return cloud.saveDesign(name, design, user.id);
  return local.saveDesign(name, design);
}

/**
 * @param {string} name
 * @returns {Promise<object|null>}
 */
export async function loadDesign(name) {
  const user = getUser();
  if (user) return cloud.loadDesign(name, user.id);
  return local.loadDesign(name);
}

/**
 * @returns {Promise<Array>} Design metadata, most recent first.
 */
export async function listDesigns() {
  const user = getUser();
  if (user) return cloud.listDesigns(user.id);
  return local.listDesigns();
}

/**
 * @param {string} name
 */
export async function deleteDesign(name) {
  const user = getUser();
  if (user) return cloud.deleteDesign(name, user.id);
  return local.deleteDesign(name);
}

/**
 * Copy designs held in browser storage up to the signed-in account.
 *
 * Existing cloud designs win: a local design whose name is already taken is
 * skipped rather than silently overwriting work saved from another device. The
 * local copies are left alone so nothing is lost if the upload half-fails.
 *
 * @returns {Promise<{ uploaded: string[], skipped: string[] }>}
 */
export async function syncLocalToCloud() {
  const user = getUser();
  if (!user) throw new Error('Sign in first to upload your saved designs.');

  const localDesigns = local.listDesigns();
  const taken = await cloud.listDesignNames(user.id);

  const uploaded = [];
  const skipped = [];

  for (const meta of localDesigns) {
    if (taken.has(meta.name)) {
      skipped.push(meta.name);
      continue;
    }

    const design = local.loadDesign(meta.name);
    if (!design) continue;

    await cloud.saveDesign(meta.name, design, user.id);
    uploaded.push(meta.name);
  }

  return { uploaded, skipped };
}

/**
 * How many designs are sitting in browser storage, used to decide whether
 * offering an upload is worthwhile.
 * @returns {number}
 */
export function localDesignCount() {
  return local.listDesigns().length;
}
