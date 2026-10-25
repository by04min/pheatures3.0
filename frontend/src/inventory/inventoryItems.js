// An inventory item is a base phoneme, optionally paired with a diacritic:
// { key, phoneme_id, symbol, diacritic_id: number|null, diacritic_symbol: string|null }
// key is "phonemeId" or "phonemeId:diacriticId" and is unique per inventory entry.

export const getInventoryKey = (phonemeId, diacriticId) =>
  diacriticId ? `${phonemeId}:${diacriticId}` : `${phonemeId}`

export const makeInventoryItem = (phoneme, diacritic = null) => ({
  key: getInventoryKey(phoneme.id, diacritic?.id),
  phoneme_id: phoneme.id,
  symbol: phoneme.symbol,
  diacritic_id: diacritic?.id ?? null,
  diacritic_symbol: diacritic?.symbol ?? null,
})
