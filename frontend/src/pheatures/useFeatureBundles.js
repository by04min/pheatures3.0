import { useEffect, useMemo, useState } from 'react'
import { applyDiacritic, fetchFeatures, isAbort } from '../api.js'

// Fetches the feature bundle of every inventory item, caching by item.key so that a change to the
// inventory only requests the items it hasn't seen yet:
//   - missing base phonemes in one POST /phonemes/features call
//   - each missing phoneme+diacritic pair via POST /diacritics/apply
// Returns
//   bundles           { item.key: { feature: value, ... } } for all items ("phonemeId" or "phonemeId:diacriticId")
//   diacriticFeatures the same, restricted to phoneme+diacritic pairs
//   ready             true once every inventory item is resolved (or the fetch failed)
//   error             message when the last fetch failed, else null
export function useFeatureBundles(inventory) {
  // cache: { item.key: bundle | null }; a null bundle means the backend had none, so don't refetch
  // failedInventory: the inventory array whose fetch failed (stops the effect from retrying forever)
  const [state, setState] = useState({ cache: {}, error: null, failedInventory: null })
  const { cache, error, failedInventory } = state

  useEffect(() => {
    const missing = inventory.filter((item) => !(item.key in cache))
    if (missing.length === 0) return

    const controller = new AbortController()
    const { signal } = controller
    const missingBase = missing.filter((item) => item.diacritic_id == null)
    const missingDiacritic = missing.filter((item) => item.diacritic_id != null)
    const baseIds = [...new Set(missingBase.map((item) => item.phoneme_id))]

    const fetchBase = baseIds.length > 0 ? fetchFeatures(baseIds, { signal }) : Promise.resolve({})
    const fetchDiacritics = Promise.all(
      missingDiacritic.map((item) => applyDiacritic(item.phoneme_id, item.diacritic_id, { signal })),
    )

    Promise.all([fetchBase, fetchDiacritics])
      .then(([base, diacritics]) => {
        const fetched = {}
        // base bundles are keyed by phoneme id, which is exactly item.key for non-diacritic items
        for (const item of missingBase) fetched[item.key] = base[item.key] ?? null
        missingDiacritic.forEach((item, i) => {
          fetched[item.key] = diacritics[i] ?? null
        })
        setState((prev) => ({ cache: { ...prev.cache, ...fetched }, error: null, failedInventory: null }))
      })
      .catch((err) => {
        if (isAbort(err)) return
        console.error(err)
        setState((prev) => ({ ...prev, error: 'Failed to load feature data.', failedInventory: inventory }))
      })

    return () => controller.abort()
  }, [inventory, cache])

  const bundles = useMemo(() => {
    const out = {}
    for (const item of inventory) if (cache[item.key]) out[item.key] = cache[item.key]
    return out
  }, [inventory, cache])

  const diacriticFeatures = useMemo(() => {
    const out = {}
    for (const item of inventory) if (item.diacritic_id != null && bundles[item.key]) out[item.key] = bundles[item.key]
    return out
  }, [inventory, bundles])

  const ready = failedInventory === inventory || inventory.every((item) => item.key in cache)

  return { bundles, diacriticFeatures, ready, error: failedInventory === inventory ? error : null }
}
