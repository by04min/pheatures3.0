/*
01. BACKEND URL
    Where the server lives; this changes between the live site and local development
*/
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? '/api' : 'http://127.0.0.1:5000/api')

/*
02. IS ABORT
    True if a request was cancelled on purpose (not a real error)
*/
export const isAbort = (err) => err?.name === 'AbortError'

/*
03. REQUEST
    Sends data to the server, reads the response, and raises an error if something goes wrong
*/
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

/*
04. GET AND POST
    Shortcuts for the two kinds of request: asking for data (get) and sending data (post)
*/
const get = (path, { signal } = {}) => request('GET', path, undefined, signal)
const post = (path, body, { signal } = {}) => request('POST', path, body, signal)

/*
05. API FUNCTIONS
    One named function for each server call, for easier reference
*/

export const getPhonemes = (opts) => get('/phonemes', opts)
export const getDiacritics = (opts) => get('/diacritics', opts)
export const fetchFeatures = (phonemeIds, opts) => post('/phonemes/features', { phoneme_ids: phonemeIds }, opts)
export const applyDiacritic = (phonemeId, diacriticId, opts) =>
  post('/diacritics/apply', { phoneme_id: phonemeId, diacritic_id: diacriticId }, opts)
export const fetchApplicablePhonemes = async (diacriticId, opts) => {
  const data = await post('/diacritics/applicable-phonemes', { diacritic_id: diacriticId }, opts)
  return Array.isArray(data.phoneme_ids) ? data.phoneme_ids : []
}

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

export const checkRules = (targetFeatures, featureChanges, opts) =>
  post('/rules/check', { target_features: targetFeatures, feature_changes: featureChanges }, opts)
