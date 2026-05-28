/**
 * PHONEME INVENTORY
 *
 * this is the interactive IPA chart (+ diacritics and whatnot) for users to choose their phoneme inventory
 *
 * DATA FLOW:
 * - GET /api/phonemes: this matches every phoneme on the table to its corresponding id in the backend
 * - GET /api/diacritics: this matches every diacritic on the table to its corresponding id in the backend
 * - when a diacritic is dragged: POST /api/diacritics/applicable-phonemes returns which phoneme
 *   ids satisfy apply_diacritic; those phonemes light up as valid drop targets.
 */

import { Fragment, useEffect, useMemo, useState } from 'react'
import { useInventoryStore } from '../store/inventoryStore'
import { PHONEME_FEATURES } from './format/phonemeFeatures.js'
import {
  CONSONANT_CELLS,
  MANNERS,
  OTHER_PHONEME_GROUPS,
  PLACES,
  VOWEL_BACKNESS,
  VOWEL_CELLS,
  VOWEL_HEIGHTS,
} from './format/phonemeLayout.js'
import { useDiacriticRows } from '../components/ipaTable/useDiacriticRows.js'
import { FeaturePanel } from '../pheatures/display/featurePanel.jsx'
import InvalidDiacriticTarget from '../components/errorMsg.jsx'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { SymbolButton, ConsonantCell, VowelCell, DiacriticChip } from '../components/ipaTable/symbolCells.jsx'


/** MAIN COMPONENT! **/

// 00. SETUP: this URL is what allows the frontend to talk to the backend (database)
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? '/api' : 'http://127.0.0.1:5000/api')

const isCombining = (symbol) => {
  const cp = symbol?.codePointAt(0)
  return cp >= 0x0300 && cp <= 0x036F
}

export default function PhonemeInventory() {

  /* SETUP */
  // the phonemes and diacrtics for display! (using the GET endpoints)
  const [phonemes, setPhonemes] = useState([])
  const [diacritics, setDiacritics] = useState([])

  // loading and error state handling
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [diacriticError, setDiacriticError] = useState('')

  /* SELECTED INVENTORY */
  const [activeSymbol, setActiveSymbol] = useState(null)
  const { inventory, toggleInventory, clearInventory } = useInventoryStore()

  /* DIACRITICS */
  // which diacritic is currently being dragged?
  const [draggingDiacriticId, setDraggingDiacriticId] = useState(null)
  // the list of phonemes that can receive the dragged diacritic
  const [applicablePhonemeIds, setApplicablePhonemeIds] = useState(new Set())

  // gets phoneme symbols
  const phonemesBySymbol = useMemo(() => {
    const out = {}
    for (const phoneme of phonemes) out[phoneme.symbol.trim().normalize('NFC')] = phoneme
    return out
  }, [phonemes])

  // gets diacritic symbols
  const diacriticsById = useMemo(() => {
    const out = {}
    for (const diacritic of diacritics) out[diacritic.id] = diacritic
    return out
  }, [diacritics])

  const {
    diacriticRowsByConsonant,
    diacriticRowsByVowel,
    diacriticRowsByOther,
  } = useDiacriticRows(inventory)

  const inventoryKeys = useMemo(() => new Set(inventory.map((item) => item.key)), [inventory])

  /** ERROR HANDLING: a cell is clickable only if the features CSV + API fetch both have the segment. */
  const canClickSymbol = (symbol) => {
    const cleanSymbol = symbol?.trim()
    if (!cleanSymbol) return false
    if (!PHONEME_FEATURES[cleanSymbol]) return false
    return !!phonemesBySymbol[cleanSymbol]
  }

  /** unique key for inventory Set membership / dedupe (plain vs paired with modifier). */
  const getInventoryKey = (phonemeId, diacriticId) =>
    diacriticId ? `${phonemeId}:${diacriticId}` : `${phonemeId}`

  /** HANDLE CLICK: add/remove the base phoneme (no diacritic). */
  const onSelectSymbol = (rawSymbol) => {
    const symbol = rawSymbol?.trim()
    if (!canClickSymbol(symbol)) return
    const phoneme = phonemesBySymbol[symbol]
    if (!phoneme) return
    const key = getInventoryKey(phoneme.id, null)
    setDiacriticError('')
    toggleInventory({ key, phoneme_id: phoneme.id, symbol: phoneme.symbol, diacritic_id: null, diacritic_symbol: null })
    setActiveSymbol(symbol)
  }

  /** Drop: add the phoneme+diacritic pair to inventory, or show an error if already applied. */
  const onDropSymbol = (rawSymbol, diacriticId) => {
    const symbol = rawSymbol?.trim()
    const phoneme = phonemesBySymbol[symbol]
    if (!phoneme || !applicablePhonemeIds.has(phoneme.id)) return
    const diacritic = diacriticsById[diacriticId]
    if (!diacritic) return
    const key = getInventoryKey(phoneme.id, diacritic.id)
    if (inventoryKeys.has(key)) {
      setDiacriticError({ title: `'${diacritic.name}' is already applied to ${phoneme.symbol.trim()}` })
    } else {
      setDiacriticError('')
      toggleInventory({
        key,
        phoneme_id: phoneme.id,
        symbol: phoneme.symbol,
        diacritic_id: diacritic.id,
        diacritic_symbol: diacritic.symbol,
      })
    }
    setDraggingDiacriticId(null)
    setApplicablePhonemeIds(new Set())
  }

  /** Drop on an incompatible phoneme: compute required vs actual features and show mismatch error. */
  const onInvalidDropSymbol = (rawSymbol, diacriticId) => {
    const symbol = rawSymbol?.trim()
    const phoneme = phonemesBySymbol[symbol]
    if (!phoneme) return
    const diacritic = diacriticsById[diacriticId]
    if (!diacritic?.condition) return

    const phonemeFeatures = PHONEME_FEATURES[symbol.normalize('NFC')] ?? {}
    const condition = diacritic.condition

    setDiacriticError({
      title: `Cannot apply ${diacritic.name} to`,
      phonemeSymbol: phoneme.symbol.trim(),
      condition,
      phonemeFeatures,
    })
    setDraggingDiacriticId(null)
    setApplicablePhonemeIds(new Set())
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /** Factory passed into ConsonantCell/VowelCell so each grid slot shares gating + inventory styling. */
  const renderSymbolButton = (symbol) => {
    if (!symbol) return <div className="w-14 h-10" />
    const cleanSymbol = symbol.trim()
    const phoneme = phonemesBySymbol[cleanSymbol]
    const key = phoneme ? getInventoryKey(phoneme.id, null) : null
    const canClick = canClickSymbol(cleanSymbol)
    const isDragTarget = !!(draggingDiacriticId && phoneme && applicablePhonemeIds.has(phoneme.id))
    const isInvalidDropTarget = !!(draggingDiacriticId && phoneme && !isDragTarget)
    const hasFeatureData = !!PHONEME_FEATURES[cleanSymbol]
    let title = cleanSymbol
    if (!hasFeatureData) title = `${cleanSymbol} (missing feature_table.csv data)`
    if (hasFeatureData && !phoneme) title = `${cleanSymbol} (missing backend phoneme id)`
    return (
      <SymbolButton
        key={`${cleanSymbol}-btn`}
        symbol={cleanSymbol}
        disabled={!canClick}
        isActive={activeSymbol === cleanSymbol}
        isInInventory={key ? inventoryKeys.has(key) : false}
        isDragging={!!draggingDiacriticId}
        isDragTarget={isDragTarget}
        isInvalidDropTarget={isInvalidDropTarget}
        onSelect={onSelectSymbol}
        onDrop={(e) => {
          e.preventDefault()
          const diacriticId = parseInt(e.dataTransfer.getData('diacritic_id'), 10)
          onDropSymbol(cleanSymbol, diacriticId)
        }}
        onInvalidDrop={(e) => {
          e.preventDefault()
          const diacriticId = parseInt(e.dataTransfer.getData('diacritic_id'), 10)
          onInvalidDropSymbol(cleanSymbol, diacriticId)
        }}
        title={title}
      />
    )
  }

  /* GET PHONEMES AND DIACRITICS */
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const [phonemeRes, diacriticRes] = await Promise.all([
          fetch(`${API_BASE}/phonemes`),
          fetch(`${API_BASE}/diacritics`),
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
        const msg = err.message ?? 'Failed to load API data.'
        setError(
          msg === 'Failed to fetch'
            ? `${msg} — start the Flask app from the backend folder (or ensure it is reachable). With Vite dev, API calls use the /api proxy.`
            : msg
        )
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  /* DIACRITIC TARGETS: fetch which phonemes are valid drop targets */
  useEffect(() => {
    const evaluateCompatibility = async () => {
      if (!draggingDiacriticId) {
        setApplicablePhonemeIds(new Set())
        return
      }
      try {
        const res = await fetch(`${API_BASE}/diacritics/applicable-phonemes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ diacritic_id: draggingDiacriticId }),
        })
        if (!res.ok) {
          console.error('applicable-phonemes failed', res.status)
          setApplicablePhonemeIds(new Set(phonemes.map((p) => p.id)))
          return
        }
        const data = await res.json()
        const ids = Array.isArray(data.phoneme_ids) ? data.phoneme_ids : []
        setApplicablePhonemeIds(new Set(ids))
      } catch (e) {
        console.error(e)
        setApplicablePhonemeIds(new Set(phonemes.map((p) => p.id)))
      }
    }
    evaluateCompatibility()
  }, [phonemes, draggingDiacriticId])

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] w-full">
      {/* ── Sticky top: title, errors, diacritics ── */}
      <div className="shrink-0 space-y-[32px] pb-8 bg-white">
        {/* Title + load / API error banners */}
        <div className="space-y-[4px]">
          <h1 className="text-[28px]">Phoneme Inventory</h1>
          <p className="text-[16px] text-gray-500 font-light">
            Click phonemes to add or remove from the inventory
          </p>
        </div>

        {/* ERROR HANDLING: default loading and error screens*/}
        {loading && <div className="text-sm text-slate-500">Loading phoneme API data...</div>}
        {error && <div className="text-sm text-rose-600">{error}</div>}
        <InvalidDiacriticTarget message={diacriticError} />

        {/* Diacritics: drag onto a phoneme to add the combined entry */}
        <section className="space-y-[8px] font-light">
          <h3 className="text-[16px]">Diacritics</h3>
          <div className="flex flex-wrap gap-1.5">
            {diacritics.map((d) => (
              <div key={d.id} className="relative group">
                <div
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('diacritic_id', d.id)
                    e.dataTransfer.effectAllowed = 'copy'
                    setDraggingDiacriticId(d.id)
                  }}
                  onDragEnd={() => {
                    setDraggingDiacriticId(null)
                    setApplicablePhonemeIds(new Set())
                  }}
                  className={`w-9 h-8 border rounded flex items-center justify-center text-[16px] select-none cursor-grab active:cursor-grabbing ${
                    draggingDiacriticId === d.id
                      ? 'border-blue-100 bg-blue-100'
                      : 'border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  {/* temp fix: postalv, backed velar diacritics render incorrectly because the unicode symbol requires a base char */}
                  {/* rendered _ instead, but uses correct unicode symbol when applying to base phoneme */}
                  {d.symbol.codePointAt(0) === 0x0320 ? '_' : d.symbol}
                </div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded bg-slate-800 text-white text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                  {d.name}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[12px] text-light text-gray-500">
            Drag a diacritic onto a compatible phoneme to add it to the inventory.
          </p>
        </section>
      </div>

      {/* ── Scrollable tables ── */}
      <div className="flex-1 min-h-[540px] overflow-y-auto space-y-[32px]">

      {/* Consonants */}
      <section className="space-y-[8px] font-light">
        <h3 className="text-[16px]">
          Consonants
        </h3>
        <div className="overflow-x-auto">
          <table className="border-collapse text-xs">
            <thead>
              <tr>
                <th className="border border-slate-200 w-36 bg-slate-50" />
                {PLACES.map(p => (
                  <th
                    key={p}
                    className="border border-slate-200 text-center font-light px-[8px] py-[12px] w-28 bg-slate-50 text-[12px]"
                  >
                    {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MANNERS.map(manner => {
                const diacriticCols = diacriticRowsByConsonant[manner]
                return (
                  <Fragment key={manner}>
                    <tr>
                      <td className="border border-slate-200 px-[8px] py-[12px] text-[12px] bg-slate-50 font-light whitespace-nowrap">
                        {manner}
                      </td>
                      {PLACES.map(place => (
                        <ConsonantCell
                          key={place}
                          manner={manner}
                          place={place}
                          renderSymbolButton={renderSymbolButton}
                        />
                      ))}
                    </tr>
                    {diacriticCols && (
                      <tr>
                        <td className="border border-slate-200 bg-slate-50" />
                        {PLACES.map(place => {
                          const cellItems = diacriticCols[place]
                          if (!cellItems) return <td key={place} className="border border-slate-200 w-28" />
                          return (
                            <td key={place} className="border border-slate-200 w-28">
                              <div className="flex">
                                {[0, 1].map(idx => {
                                  const items = cellItems[idx]
                                  if (!items?.length) return <div key={idx} className="w-14 h-10" />
                                  return items.map(item => (
                                    <DiacriticChip key={item.key} item={item} onRemove={toggleInventory} isDragging={!!draggingDiacriticId} />
                                  ))
                                })}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Vowels + Other Phonemes */}
      <div className="flex flex-wrap gap-12">
        {/* Vowels */}
        <section className="space-y-[8px] font-light">
        <h3 className="text-[16px]">
          Vowels
        </h3>
          <table className="border-collapse text-xs">
            <thead>
              <tr>
                <th className="border border-slate-200 w-32 bg-slate-50" />
                {VOWEL_BACKNESS.map(b => (
                  <th
                    key={b}
                    className="border border-slate-200 text-center font-light px-[8px] py-[12px] w-28 bg-slate-50 text-[12px]"
                  >
                    {b}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {VOWEL_HEIGHTS.map(height => {
                const diacriticCols = diacriticRowsByVowel[height]
                return (
                  <Fragment key={height}>
                    <tr>
                      <td className="border border-slate-200 px-[8px] py-[12px] text-[12px] bg-slate-50 font-light whitespace-nowrap">
                        {height}
                      </td>
                      {VOWEL_BACKNESS.map(backness => (
                        <VowelCell
                          key={backness}
                          height={height}
                          backness={backness}
                          renderSymbolButton={renderSymbolButton}
                        />
                      ))}
                    </tr>
                    {diacriticCols && (
                      <tr>
                        <td className="border border-slate-200 bg-slate-50" />
                        {VOWEL_BACKNESS.map(backness => {
                          const cellItems = diacriticCols[backness]
                          if (!cellItems) return <td key={backness} className="border border-slate-200 w-28" />
                          return (
                            <td key={backness} className="border border-slate-200 p-0 w-28">
                              <div className="flex justify-center">
                                {[0, 1].map(idx => {
                                  const items = cellItems[idx]
                                  if (!items?.length) return <div key={idx} className="w-14 h-10" />
                                  return items.map(item => (
                                    <DiacriticChip key={item.key} item={item} onRemove={toggleInventory} isDragging={!!draggingDiacriticId} />
                                  ))
                                })}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </section>

        {/* Other Phonemes */}
        <section className="space-y-[8px] font-light">
        <h3 className="text-[16px]">
          Other Phonemes
        </h3>
          <div className="flex flex-col gap-2">
            {[OTHER_PHONEME_GROUPS.slice(0, 4), OTHER_PHONEME_GROUPS.slice(4)].map((groups, i) => (
              <table key={i} className="border-collapse text-xs">
                <thead>
                  <tr>
                    {groups.map(group => (
                      <th
                        key={group.label}
                        className="border border-slate-200 text-center font-light px-[8px] py-[12px] w-28 bg-slate-50 text-[12px]"
                      >
                        {group.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {groups.map(group => (
                      <td key={group.label} className="border border-slate-200 w-28">
                        <div className="flex">
                          {group.phonemes.map(s => renderSymbolButton(s))}
                        </div>
                      </td>
                    ))}
                  </tr>
                  {groups.some(g => g.label in diacriticRowsByOther) && (
                    <tr>
                      {groups.map(group => {
                        const cellItems = diacriticRowsByOther[group.label]
                        if (!cellItems) return <td key={group.label} className="border border-slate-200 w-28" />
                        return (
                          <td key={group.label} className="border border-slate-200 w-28">
                            <div className="flex">
                              {group.phonemes.map((_, idx) => {
                                const items = cellItems[idx]
                                if (!items?.length) return <div key={idx} className="w-14 h-10" />
                                return items.map(item => (
                                  <DiacriticChip key={item.key} item={item} onRemove={toggleInventory} isDragging={!!draggingDiacriticId} />
                                ))
                              })}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  )}
                </tbody>
              </table>
            ))}
          </div>
        </section>
      </div>
      </div>

      {/* Buttons */}
      <div className="shrink-0 pt-8 pb-16">
        <button onClick={() => { clearInventory(); setDiacriticError('') }} className="px-[20px] py-[16px] bg-gray-800 rounded-[4px] hover:opacity-70">
          <div className="flex flex-row items-center gap-2 text-white">
            <DeleteOutlinedIcon />
            <label className="text-[16px] font-light">Clear Inventory</label>
          </div>
          
          </button>
      </div>
    </div>
  )
}
