import { useEffect, useMemo, useState } from 'react'
import { getDiacritics, getPhonemes, isAbort } from '../../lib/api.js'

/*
01. USE INVENTORY DATA
    Loads all sounds and diacritics from the server when the page opens,
    and builds lookup tables to find each one by its symbol or id
*/
export function useInventoryData() {
  const [phonemes, setPhonemes] = useState([])
  const [diacritics, setDiacritics] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingSlow, setLoadingSlow] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    // After 5 seconds, flag the load as "slow" so the page can show a patience message
    const slowTimer = setTimeout(() => setLoadingSlow(true), 5000)
    const load = async () => {
      try {
        setLoading(true)
        setLoadingSlow(false)
        setError('')
        // This is the request to the backend using routes!
        const [phonemeData, diacriticData] = await Promise.all([getPhonemes({ signal }), getDiacritics({ signal })])
        setPhonemes(phonemeData)
        setDiacritics(diacriticData)
      } catch (err) {
        if (isAbort(err)) return
        console.error(err)
        setError(
          err.message === 'Failed to fetch'
            ? `${err.message} — start the Flask app from the backend folder (or ensure it is reachable). With Vite dev, API calls use the /api proxy.`
            : 'Failed to load phoneme or diacritic data.',
        )
      } finally {
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

  // Lookup tables: find a sound or diacritic instantly by symbol or id
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

  // a list per symbol, since two diacritics can share one mark (postalveolar and backed velar)
  const diacriticsBySymbol = useMemo(() => {
    const out = {}
    for (const d of diacritics) (out[d.symbol.trim()] ??= []).push(d)
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
