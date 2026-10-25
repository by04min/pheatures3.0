import { useEffect, useMemo, useState } from 'react'
import { API_BASE, isAbort } from '../api.js'

// Loads every phoneme and diacritic from the backend (GET /phonemes, GET /diacritics) and
// indexes them for lookup.
//   loadingSlow flips on after 5s so the page can warn about the free-tier cold start
export function useInventoryData() {
  const [phonemes, setPhonemes] = useState([])
  const [diacritics, setDiacritics] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingSlow, setLoadingSlow] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    const slowTimer = setTimeout(() => setLoadingSlow(true), 5000)
    const load = async () => {
      try {
        setLoading(true)
        setLoadingSlow(false)
        setError('')
        const [phonemeRes, diacriticRes] = await Promise.all([
          fetch(`${API_BASE}/phonemes`, { signal }),
          fetch(`${API_BASE}/diacritics`, { signal }),
        ])
        if (!phonemeRes.ok || !diacriticRes.ok) {
          throw new Error('Failed to load phoneme or diacritic data.')
        }
        const [phonemeData, diacriticData] = await Promise.all([
          phonemeRes.json(),
          diacriticRes.json(),
        ])
        setPhonemes(phonemeData)
        setDiacritics(diacriticData)
      } catch (err) {
        if (isAbort(err)) return
        const msg = err.message ?? 'Failed to load API data.'
        setError(
          msg === 'Failed to fetch'
            ? `${msg} — start the Flask app from the backend folder (or ensure it is reachable). With Vite dev, API calls use the /api proxy.`
            : msg
        )
      } finally {
        // an aborted load was superseded (unmount / StrictMode remount); the new one owns these flags
        if (!signal.aborted) {
          setLoading(false)
          setLoadingSlow(false)
        }
      }
    }
    load()
    return () => {
      clearTimeout(slowTimer)
      controller.abort()
    }
  }, [])

  const phonemesBySymbol = useMemo(() => {
    const out = {}
    for (const phoneme of phonemes) out[phoneme.symbol.trim().normalize('NFC')] = phoneme
    return out
  }, [phonemes])

  const diacriticsById = useMemo(() => {
    const out = {}
    for (const diacritic of diacritics) out[diacritic.id] = diacritic
    return out
  }, [diacritics])

  const diacriticsBySymbol = useMemo(() => {
    const out = {}
    for (const d of diacritics) out[d.symbol.trim()] = d
    return out
  }, [diacritics])

  return {
    phonemes,
    diacritics,
    phonemesBySymbol,
    diacriticsById,
    diacriticsBySymbol,
    loading,
    loadingSlow,
    error,
  }
}
