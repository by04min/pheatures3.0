import { useEffect, useMemo, useState } from 'react'
import { isAbort, postJson } from '../api.js'

const NO_TRANSFORMS = {}

// Applies the rule (target features -> feature changes) to the inventory via POST /phonemes/transform.
// Waits for `ready` (feature bundles loaded) so one change produces one request.
// Returns
//   transforms         { item.key: { matched, transformed, original_symbol, result_symbol, result_bundle, valid } },
//                      empty when there is nothing to apply
//   transformsLoading  true while a request for the current inputs is pending
//   error              message when the last request failed, else null
export function useTransforms(inventory, targetFeatures, featureChanges, diacriticFeatures, ready) {
  // the request inputs; `result.inputs` records which inputs a result belongs to
  const inputs = useMemo(
    () => ({ inventory, targetFeatures, featureChanges, diacriticFeatures }),
    [inventory, targetFeatures, featureChanges, diacriticFeatures]
  )
  const [result, setResult] = useState({ inputs: null, transforms: NO_TRANSFORMS, error: null })

  // nothing to do when both columns are empty (either alone is enough to call the backend:
  // - target only → filter inventory to matching phonemes
  // - changes only → apply to all inventory phonemes, since an empty target matches everything)
  // or when the inventory is empty
  const idle =
    inventory.length === 0 ||
    (Object.keys(targetFeatures).length === 0 && Object.keys(featureChanges).length === 0)

  useEffect(() => {
    if (idle || !ready) return

    const controller = new AbortController()
    const phonemeIds = [...new Set(inventory.map((item) => item.phoneme_id))]

    // send all diacritic items; include the pre-fetched bundle when available so the backend
    // can skip its own DB lookup, otherwise the backend derives it from phoneme_id + diacritic_id
    const diacriticItems = inventory
      .filter((item) => item.diacritic_id != null)
      .map((item) => ({
        key: item.key,
        phoneme_id: item.phoneme_id,
        diacritic_id: item.diacritic_id,
        symbol: `${item.symbol.trim()}${item.diacritic_symbol ?? ''}`,
        bundle: diacriticFeatures[item.key] ?? null,
      }))

    postJson(
      '/phonemes/transform',
      { phoneme_ids: phonemeIds, diacritic_items: diacriticItems, target_features: targetFeatures, feature_changes: featureChanges },
      { signal: controller.signal }
    )
      .then((data) => setResult({ inputs, transforms: data, error: null }))
      .catch((err) => {
        if (isAbort(err)) return
        console.error(err)
        setResult({ inputs, transforms: NO_TRANSFORMS, error: 'Failed to apply rules.' })
      })

    return () => controller.abort()
  }, [idle, ready, inputs, inventory, targetFeatures, featureChanges, diacriticFeatures])

  if (idle) return { transforms: NO_TRANSFORMS, transformsLoading: false, error: null }
  return {
    transforms: result.transforms,
    transformsLoading: !ready || result.inputs !== inputs,
    error: result.inputs === inputs ? result.error : null,
  }
}
