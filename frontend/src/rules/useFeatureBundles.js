import { useEffect, useMemo, useState } from 'react'
import { applyDiacritic, fetchFeatures, isAbort } from '../api.js'

/*
01. USE FEATURE BUNDLES
    Gets the features (e.g. voice: +, nasal: -) of every sound in the inventory from the server.
    Features already loaded are remembered, so adding a sound only asks for the new one.

    RETURNS:
    - bundles: the features of each sound
    - diacriticFeatures: the same, but only for sounds with a diacritic
    - ready: true once everything has loaded (or loading failed)
    - error: a message if loading failed, otherwise null
*/
export function useFeatureBundles(inventory) {
  // cache: features already loaded, by sound; null means the server had none, so don't ask again
  // failedInventory: the inventory that failed to load, so we don't retry it endlessly
  const [state, setState] = useState({ cache: {}, error: null, failedInventory: null })
  const { cache, error, failedInventory } = state

  // Runs whenever the inventory changes
  useEffect(() => {
    // Only ask the server about sounds we haven't loaded yet
    const missing = inventory.filter((item) => !(item.key in cache))
    if (missing.length === 0) return

    // Lets us cancel the request if the inventory changes again before it finishes
    const controller = new AbortController()
    const { signal } = controller

    // Plain sounds and sounds-with-diacritics are requested in different ways
    const missingBase = missing.filter((item) => item.diacritic_id == null)
    const missingDiacritic = missing.filter((item) => item.diacritic_id != null)
    const baseIds = [...new Set(missingBase.map((item) => item.phoneme_id))]

    // Plain sounds are fetched together in one request; each sound-with-diacritic is fetched on its own
    const fetchBase = baseIds.length > 0 ? fetchFeatures(baseIds, { signal }) : Promise.resolve({})
    const fetchDiacritics = Promise.all(
      missingDiacritic.map((item) => applyDiacritic(item.phoneme_id, item.diacritic_id, { signal })),
    )

    Promise.all([fetchBase, fetchDiacritics])
      .then(([base, diacritics]) => {
        // Match each result back to its sound, then add it to what we've already loaded
        const fetched = {}
        for (const item of missingBase) fetched[item.key] = base[item.key] ?? null
        missingDiacritic.forEach((item, i) => {
          fetched[item.key] = diacritics[i] ?? null
        })
        setState((prev) => ({ cache: { ...prev.cache, ...fetched }, error: null, failedInventory: null }))
      })
      .catch((err) => {
        // A cancelled request isn't a real failure
        if (isAbort(err)) return
        console.error(err)
        setState((prev) => ({ ...prev, error: 'Failed to load feature data.', failedInventory: inventory }))
      })

    return () => controller.abort()
  }, [inventory, cache])

  // The features of each sound currently in the inventory
  const bundles = useMemo(() => {
    const out = {}
    for (const item of inventory) if (cache[item.key]) out[item.key] = cache[item.key]
    return out
  }, [inventory, cache])

  // The same, but only for sounds with a diacritic
  const diacriticFeatures = useMemo(() => {
    const out = {}
    for (const item of inventory) if (item.diacritic_id != null && bundles[item.key]) out[item.key] = bundles[item.key]
    return out
  }, [inventory, bundles])

  // "Ready" once every sound has loaded, or loading failed (so the page doesn't wait forever)
  const ready = failedInventory === inventory || inventory.every((item) => item.key in cache)

  return { bundles, diacriticFeatures, ready, error: failedInventory === inventory ? error : null }
}
