// Pure frontend minimality checks for rule specifications.
// Contradiction detection is handled by the backend /api/rules/check endpoint.

function getBundle(item, baseFeatures, diacriticFeatures) {
  return item.diacritic_id != null
    ? diacriticFeatures[item.key]
    : baseFeatures[String(item.phoneme_id)]
}

function rowsToSpec(rows) {
  return Object.fromEntries(
    rows.filter((r) => r.value && r.feature).map((r) => [r.feature, r.value])
  )
}

/*
01. HAS REDUNDANT TARGET FEATURES
    PURPOSE:
    - checks whether the target features are non-minimal, using two sub-checks:
      (A) strict redundancy — removing a feature returns the exact same matched set
          (the feature doesn't narrow the class at all)
      (B) fire-and-rain — removing a feature widens the class, but every extra phoneme
          newly included already satisfies the change spec, so the rule would be a
          no-op on those extras (only the original matched set actually changes)
    - example of (B): target [+voice] + change [-voice] — dropping +voice from the
      left adds all -voice phonemes, but those are already -voice and wouldn't be
      affected by the change

    PARAMS:
    - targetRows: [{value: '+'/'-'/'0', feature: string}]
    - changeRows:  [{value: '+'/'-'/'0', feature: string}]  (needed for fire-and-rain)
    - inventory: the current inventory items from the store
    - baseFeatures: { phoneme_id_str: { feature: value, ... } }
    - diacriticFeatures: { item.key: { feature: value, ... } }

    RETURNS:
    - true  if at least one target feature is redundant (either sub-check)
    - false otherwise
*/
export function hasRedundantTargetFeatures(targetRows, changeRows, inventory, baseFeatures, diacriticFeatures) {
  const targetSpec = rowsToSpec(targetRows)
  const changeSpec = rowsToSpec(changeRows)
  const entries = Object.entries(targetSpec)
  if (entries.length === 0) return false

  const matchesSpec = (item, featureSpec) => {
    const bundle = getBundle(item, baseFeatures, diacriticFeatures)
    return bundle != null && Object.entries(featureSpec).every(([f, v]) => bundle[f] === v)
  }

  const fullMatched = inventory.filter((item) => matchesSpec(item, targetSpec))
  const fullMatchedKeys = new Set(fullMatched.map((item) => item.key))

  return entries.some(([feat]) => {
    const reduced = Object.fromEntries(entries.filter(([f]) => f !== feat))
    const reducedMatched = inventory.filter((item) => matchesSpec(item, reduced))

    // (A) strict: removing this feature doesn't change the matched set
    if (reducedMatched.length === fullMatched.length) return true

    // (B) fire-and-rain: removing this feature widens the class, but every newly
    //     included phoneme already satisfies the change spec (rule is a no-op on them)
    if (Object.keys(changeSpec).length > 0) {
      const extras = reducedMatched.filter((item) => !fullMatchedKeys.has(item.key))
      if (extras.length > 0 && extras.every((item) => matchesSpec(item, changeSpec))) return true
    }

    return false
  })
}

/*
02. HAS REDUNDANT CHANGE FEATURES
    PURPOSE:
    - checks whether any change feature is already satisfied by every matched phoneme
    - a change feature is redundant when it doesn't actually change any matched phoneme's
      value (all matched phonemes already carry the target value for that feature)

    PARAMS:
    - changeRows:  [{value: '+'/'-'/'0', feature: string}]
    - targetRows: [{value: '+'/'-'/'0', feature: string}]
    - inventory: the current inventory items from the store
    - baseFeatures: { phoneme_id_str: { feature: value, ... } }
    - diacriticFeatures: { item.key: { feature: value, ... } }

    RETURNS:
    - true  if at least one change feature is already satisfied by every matched phoneme
    - false otherwise (or if no phonemes are matched)
*/
export function hasRedundantChangeFeatures(changeRows, targetRows, inventory, baseFeatures, diacriticFeatures) {
  const targetSpec = rowsToSpec(targetRows)
  const changeSpec = rowsToSpec(changeRows)
  if (Object.keys(changeSpec).length === 0) return false

  const matched = inventory.filter((item) => {
    const bundle = getBundle(item, baseFeatures, diacriticFeatures)
    return bundle != null && Object.entries(targetSpec).every(([f, v]) => bundle[f] === v)
  })
  if (matched.length === 0) return false

  return Object.entries(changeSpec).some(([feat, val]) =>
    matched.every((item) => {
      const bundle = getBundle(item, baseFeatures, diacriticFeatures)
      return bundle != null && bundle[feat] === val
    })
  )
}
