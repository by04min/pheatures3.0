import { useEffect, useState } from 'react'
import { checkRules, isAbort } from '../../lib/api.js'

const NO_CONTRADICTIONS = { target_contradictions: [], change_contradictions: [] }

/*
01. USE RULE CHECK
    Asks the server whether the rule is impossible (e.g. a sound that must be both + and - for the same feature)

    RETURNS:
    - contradictions: the contradictions found in the target and in the changes
    - error: a message if the check failed, otherwise null
*/
export function useRuleCheck(targetFeatures, featureChanges) {
  // The latest answer from the server: any contradictions found, or an error message
  const [result, setResult] = useState({ contradictions: NO_CONTRADICTIONS, error: null })

  // Nothing to check if the rule is empty
  const idle = Object.keys(targetFeatures).length === 0 && Object.keys(featureChanges).length === 0

  // Runs whenever the rule changes
  useEffect(() => {
    if (idle) return

    // Lets us cancel the check if the rule changes again before it finishes
    const controller = new AbortController()
    checkRules(targetFeatures, featureChanges, { signal: controller.signal })
      .then((contradictions) => setResult({ contradictions, error: null }))
      .catch((err) => {
        // A cancelled check isn't a real failure
        if (isAbort(err)) return
        console.error(err)
        setResult({ contradictions: NO_CONTRADICTIONS, error: 'Failed to check the rule for contradictions.' })
      })

    return () => controller.abort()
  }, [idle, targetFeatures, featureChanges])

  if (idle) return { contradictions: NO_CONTRADICTIONS, error: null }
  return { contradictions: result.contradictions, error: result.error }
}
