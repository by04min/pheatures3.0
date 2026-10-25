// All backend calls live here, so the API contract (paths and body shapes) is in one place.
// Each function takes an optional { signal } from an AbortController to cancel the request.

// backend URL: Vite's /api proxy in dev, VITE_API_BASE_URL (or local Flask) otherwise
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? '/api' : 'http://127.0.0.1:5000/api')

// true for the error thrown when a request is cancelled with an AbortController (not a real failure)
export const isAbort = (err) => err?.name === 'AbortError'

// fetch and parse JSON; throws on a non-2xx status
async function request(method, path, body, signal) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  })
  if (!res.ok) throw new Error(`${method} ${path} failed (${res.status})`)
  return res.json()
}

const get = (path, { signal } = {}) => request('GET', path, undefined, signal)
const post = (path, body, { signal } = {}) => request('POST', path, body, signal)

// every phoneme: [{ id, symbol, ... }]
export const getPhonemes = (opts) => get('/phonemes', opts)

// every diacritic: [{ id, symbol, name, condition, ... }]
export const getDiacritics = (opts) => get('/diacritics', opts)

// feature bundles of base phonemes: { phoneme_id: { feature: value, ... } }
export const fetchFeatures = (phonemeIds, opts) => post('/phonemes/features', { phoneme_ids: phonemeIds }, opts)

// feature bundle of a phoneme with a diacritic applied: { feature: value, ... }
export const applyDiacritic = (phonemeId, diacriticId, opts) =>
  post('/diacritics/apply', { phoneme_id: phonemeId, diacritic_id: diacriticId }, opts)

// ids of the phonemes a diacritic can be applied to: number[]
export const fetchApplicablePhonemes = async (diacriticId, opts) => {
  const data = await post('/diacritics/applicable-phonemes', { diacritic_id: diacriticId }, opts)
  return Array.isArray(data.phoneme_ids) ? data.phoneme_ids : []
}

// applies a rule to the inventory: { item.key: { matched, transformed, original_symbol, result_symbol, result_bundle, valid } }
export const transformInventory = ({ phonemeIds, diacriticItems, targetFeatures, featureChanges }, opts) =>
  post(
    '/phonemes/transform',
    {
      phoneme_ids: phonemeIds,
      diacritic_items: diacriticItems,
      target_features: targetFeatures,
      feature_changes: featureChanges,
    },
    opts,
  )

// phonologically impossible rule specs: { target_contradictions: [...], change_contradictions: [...] }
export const checkRules = (targetFeatures, featureChanges, opts) =>
  post('/rules/check', { target_features: targetFeatures, feature_changes: featureChanges }, opts)
