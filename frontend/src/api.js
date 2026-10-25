// backend URL: Vite's /api proxy in dev, VITE_API_BASE_URL (or local Flask) otherwise
export const API_BASE =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? '/api' : 'http://127.0.0.1:5000/api')

// POST a JSON body to the backend and return the parsed JSON response; throws on a non-2xx status
export async function postJson(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`POST ${path} failed (${res.status})`)
  return res.json()
}
