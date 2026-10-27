/*
00. INVENTORY ITEM
    An item in the inventory is a plain sound, optionally paired with a diacritic.
    Each item is stored as: { key, phoneme_id, symbol, diacritic_id: number|null, diacritic_symbol: string|null }
    where 'key' is "phonemeId" or "phonemeId:diacriticId"
*/

/*
01. GET INVENTORY KEY
    Builds an item's key from its sound id and (optional) diacritic id
*/
export const getInventoryKey = (phonemeId, diacriticId) =>
  diacriticId ? `${phonemeId}:${diacriticId}` : `${phonemeId}`

/*
02. MAKE INVENTORY ITEM
    Builds an inventory item from a sound and (optionally) a diacritic
*/
export const makeInventoryItem = (phoneme, diacritic = null) => ({
  key: getInventoryKey(phoneme.id, diacritic?.id),
  phoneme_id: phoneme.id,
  symbol: phoneme.symbol,
  diacritic_id: diacritic?.id ?? null,
  diacritic_symbol: diacritic?.symbol ?? null,
})

/*
03. DIACRITIC DISPLAY SYMBOL
    The symbol shown on a diacritic's tile (the real symbol is still used when it's applied)
*/
export const diacriticDisplaySymbol = (diacritic) =>
  // postalveolar and backed velar render as the same symbol in the frontend until it is applied
  // (for some reason the symbol for backed velar won't show unless it's attached to something)
  diacritic.symbol.codePointAt(0) === 0x0320 ? '_' : diacritic.symbol
