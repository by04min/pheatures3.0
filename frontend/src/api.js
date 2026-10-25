// backend URL: Vite's /api proxy in dev, VITE_API_BASE_URL (or local Flask) otherwise
export const API_BASE =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? '/api' : 'http://127.0.0.1:5000/api')

// true for the error thrown when a request is cancelled with an AbortController (not a real failure)
export const isAbort = (err) => err?.name === 'AbortError'

// POST a JSON body to the backend and return the parsed JSON response; throws on a non-2xx status.
// pass { signal } from an AbortController to cancel the request
export async function postJson(path, body, { signal } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  if (!res.ok) throw new Error(`POST ${path} failed (${res.status})`)
  return res.json()
}
