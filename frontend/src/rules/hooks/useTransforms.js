import { useEffect, useMemo, useState } from 'react'
import { isAbort, transformInventory } from '../../lib/api.js'

const NO_TRANSFORMS = {}

/*
01. USE TRANSFORMS
    Applies the rule (target features -> feature changes) to the inventory, via the server

    RETURNS:
    - transforms: what each sound turns into (empty when there's nothing to apply)
    - transformsLoading: true while waiting for the server
    - error: a message if applying the rule failed, otherwise null
*/
export function useTransforms(inventory, targetFeatures, featureChanges, diacriticFeatures, ready) {
  
  // Everything the result depends on, bundled together so we can tell
  // whether a result belongs to the current inputs or to an older set
  const inputs = useMemo(
    () => ({ inventory, targetFeatures, featureChanges, diacriticFeatures }),
    [inventory, targetFeatures, featureChanges, diacriticFeatures],
  )
  
  // The latest result from the server: what each sound turns into, or an error message
  const [result, setResult] = useState({ inputs: null, transforms: NO_TRANSFORMS, error: null })

  // Nothing to do if the inventory is empty or the rule is empty.
  // A rule with only a target picks out matching sounds; a rule with only changes applies to every sound.
  const idle =
    inventory.length === 0 || (Object.keys(targetFeatures).length === 0 && Object.keys(featureChanges).length === 0)

  // Runs whenever the inventory or rule changes
  useEffect(() => {
    // Wait until the sounds' features have loaded, so one change sends just one request
    if (idle || !ready) return

    // Lets us cancel the request if the rule changes again before it finishes
    const controller = new AbortController()
    const phonemeIds = [...new Set(inventory.map((item) => item.phoneme_id))]

    // Sounds with diacritics are sent separately. If their features were already loaded we include them,
    // which saves the server from looking them up again.
    const diacriticItems = inventory
      .filter((item) => item.diacritic_id != null)
      .map((item) => ({
        key: item.key,
        phoneme_id: item.phoneme_id,
        diacritic_id: item.diacritic_id,
        symbol: `${item.symbol.trim()}${item.diacritic_symbol ?? ''}`,
        bundle: diacriticFeatures[item.key] ?? null,
      }))

    transformInventory({ phonemeIds, diacriticItems, targetFeatures, featureChanges }, { signal: controller.signal })
      .then((data) => setResult({ inputs, transforms: data, error: null }))
      .catch((err) => {
        // A cancelled request isn't a real failure
        if (isAbort(err)) return
        console.error(err)
        setResult({ inputs, transforms: NO_TRANSFORMS, error: 'Failed to apply rules.' })
      })

    return () => controller.abort()
  }, [idle, ready, inputs, inventory, targetFeatures, featureChanges, diacriticFeatures])

  // Report "loading" while waiting, or while the latest result is for older inputs; hide errors from older inputs
  if (idle) return { transforms: NO_TRANSFORMS, transformsLoading: false, error: null }
  return {
    transforms: result.transforms,
    transformsLoading: !ready || result.inputs !== inputs,
    error: result.inputs === inputs ? result.error : null,
  }
}
