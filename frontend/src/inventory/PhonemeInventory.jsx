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
 *
 * DIACRITIC SUB-ROWS:
 * Each diacritic applied to a phoneme appears in its own sub-row directly beneath
 * that phoneme's base row. If two diacritics are applied to the same phoneme (e.g.
 * both applied to /p/), two sub-rows are rendered, each chip aligned to /p/'s column.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useInventoryStore } from '../store/inventoryStore'
import { useThemeStore } from '../store/themeStore'
import { PHONEME_FEATURES } from './format/phonemeFeatures.js'
import {
  MANNERS,
  OTHER_PHONEME_GROUPS,
  PLACES,
  VOWEL_BACKNESS,
  VOWEL_HEIGHTS,
} from './format/phonemeLayout.js'
import { useDiacriticRows } from '../components/ipaTable/useDiacriticRows.js'
import { IpaTableGrid } from '../components/ipaTable/IpaTableGrid.jsx'
import { FeaturePanel } from '../pheatures/display/featurePanel.jsx'
import InvalidDiacriticTarget from '../components/errorMsg.jsx'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { SymbolButton, DiacriticChip } from '../components/ipaTable/symbolCells.jsx'
import { PRESETS } from './format/presetInventories.js'


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
  const { isDark } = useThemeStore()

  /* SETUP */
  // the phonemes and diacrtics for display! (using the GET endpoints)
  const [phonemes, setPhonemes] = useState([])
  const [diacritics, setDiacritics] = useState([])

  // loading and error state handling
  const [loading, setLoading] = useState(true)
  const [loadingSlow, setLoadingSlow] = useState(false)
  const [error, setError] = useState('')
  const [diacriticError, setDiacriticError] = useState('')
  const [loadingApplicable, setLoadingApplicable] = useState(false)

  /* SELECTED INVENTORY */
  const [activeSymbol, setActiveSymbol] = useState(null)
  const [selectedPresetId, setSelectedPresetId] = useState('')
  const { inventory, toggleInventory, clearInventory } = useInventoryStore()

  /* DIACRITICS */
  // which diacritic is currently being dragged?
  const [draggingDiacriticId, setDraggingDiacriticId] = useState(null)
  // the list of phonemes that can receive the dragged diacritic
  const [applicablePhonemeIds, setApplicablePhonemeIds] = useState(new Set())
  // ref mirror of applicablePhonemeIds for use in touch handlers (avoids stale closures)
  const applicableIdsRef = useRef(new Set())
  // touch drag state
  const [touchIndicatorPos, setTouchIndicatorPos] = useState(null)
  const touchDraggingRef = useRef(null) // { id, displaySymbol } | null

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

  const diacriticsBySymbol = useMemo(() => {
    const out = {}
    for (const d of diacritics) out[d.symbol.trim()] = d
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
    applicableIdsRef.current = new Set()
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
    applicableIdsRef.current = new Set()
    setApplicablePhonemeIds(new Set())
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /** Resolve a CSV symbol string to an inventory entry, handling base-only and base+diacritic forms. */
  const resolvePresetSymbol = (raw) => {
    const symbol = raw.trim().normalize('NFC')
    const phoneme = phonemesBySymbol[symbol]
    if (phoneme) {
      return { key: getInventoryKey(phoneme.id, null), phoneme_id: phoneme.id, symbol: phoneme.symbol, diacritic_id: null, diacritic_symbol: null }
    }
    const diacriticSymbols = Object.keys(diacriticsBySymbol).sort((a, b) => b.length - a.length)
    for (const ds of diacriticSymbols) {
      if (ds && symbol.endsWith(ds)) {
        const base = symbol.slice(0, -ds.length)
        const basePhoneme = phonemesBySymbol[base]
        const diacritic = diacriticsBySymbol[ds]
        if (basePhoneme && diacritic) {
          return { key: getInventoryKey(basePhoneme.id, diacritic.id), phoneme_id: basePhoneme.id, symbol: basePhoneme.symbol, diacritic_id: diacritic.id, diacritic_symbol: diacritic.symbol }
        }
      }
    }
    return null
  }

  const loadPreset = (presetId) => {
    const preset = PRESETS.find(p => p.id === presetId)
    if (!preset) return
    clearInventory()
    for (const sym of preset.symbols) {
      const entry = resolvePresetSymbol(sym)
      if (entry) toggleInventory(entry)
    }
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
    const slowTimer = setTimeout(() => setLoadingSlow(true), 5000)
    const load = async () => {
      try {
        setLoading(true)
        setLoadingSlow(false)
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
        setLoadingSlow(false)
      }
    }
    load()
    return () => clearTimeout(slowTimer)
  }, [])

  /* DIACRITIC TARGETS: fetch which phonemes are valid drop targets */
  useEffect(() => {
    const evaluateCompatibility = async () => {
      if (!draggingDiacriticId) {
        applicableIdsRef.current = new Set()
        setApplicablePhonemeIds(new Set())
        setLoadingApplicable(false)
        return
      }
      setLoadingApplicable(true)
      try {
        const res = await fetch(`${API_BASE}/diacritics/applicable-phonemes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ diacritic_id: draggingDiacriticId }),
        })
        if (!res.ok) {
          console.error('applicable-phonemes failed', res.status)
          const fallback = new Set(phonemes.map((p) => p.id))
          applicableIdsRef.current = fallback
          setApplicablePhonemeIds(fallback)
          return
        }
        const data = await res.json()
        const ids = Array.isArray(data.phoneme_ids) ? data.phoneme_ids : []
        const idSet = new Set(ids)
        applicableIdsRef.current = idSet
        setApplicablePhonemeIds(idSet)
      } catch (e) {
        console.error(e)
        const fallback = new Set(phonemes.map((p) => p.id))
        applicableIdsRef.current = fallback
        setApplicablePhonemeIds(fallback)
      } finally {
        setLoadingApplicable(false)
      }
    }
    evaluateCompatibility()
  }, [phonemes, draggingDiacriticId])

  /* TOUCH DRAG: prevent page scroll while a diacritic is being touch-dragged */
  useEffect(() => {
    if (!draggingDiacriticId) return
    const prevent = (e) => e.preventDefault()
    document.addEventListener('touchmove', prevent, { passive: false })
    return () => document.removeEventListener('touchmove', prevent)
  }, [draggingDiacriticId])

  const resetTouchDrag = () => {
    touchDraggingRef.current = null
    setDraggingDiacriticId(null)
    applicableIdsRef.current = new Set()
    setApplicablePhonemeIds(new Set())
    setTouchIndicatorPos(null)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] w-full">
      {/* ── Sticky top: title, errors, diacritics ── */}
      <div className={`shrink-0 space-y-[32px] pb-8 transition-colors duration-300 ${isDark ? 'bg-[#0E1116]' : 'bg-white'}`}>
        {/* Title + load / API error banners */}
        <div className="space-y-[4px]">
          <h1 className="text-[28px]">Phoneme Inventory</h1>
          <p className={`text-[16px] font-light ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Click phonemes to add or remove from the inventory
          </p>
        </div>

        {/* ERROR HANDLING: error messages */}
        {error && <div className="text-sm text-rose-600">{error}</div>}
        <InvalidDiacriticTarget message={diacriticError} onClose={() => setDiacriticError(null)} />

        {/* Diacritics: drag onto a phoneme to add the combined entry */}
        <section className="space-y-[32px] font-light">

          <div className="flex items-center justify-between">
            <select
              value={selectedPresetId}
              onChange={(e) => { setSelectedPresetId(e.target.value); loadPreset(e.target.value) }}
              className={`border border-slate-200 rounded-[4px] px-[8px] py-[6px] text-[14px] font-light text-black ${isDark ? 'bg-gray-100' : 'bg-white'}`}
            >
              <option value="" disabled>Select Preset</option>
              {PRESETS.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
            <button
              onClick={() => { clearInventory(); setDiacriticError(''); setSelectedPresetId('') }}
              className={`text-[14px] font-light underline transition-colors ${isDark ? 'hover:text-gray-300' : 'hover:text-slate-600'}`}
            >
              <span className="flex items-center gap-1">
                Clear Inventory
                <DeleteOutlinedIcon style={{ fontSize: 16 }} />
              </span>
            </button>
          </div>

          {/* loading message  */}
          {loading && (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-2">
              <span className="text-sm text-slate-600">Loading phoneme data...</span>
              {loadingSlow && (
                <span className="text-sm text-slate-600 italic text-center">Please don't leave!<br />Loading only takes a bit the first time (Free tiers am I right...)</span>
              )}
            </div>
          )}

          <div className="space-y-[8px]">
          <h3 className="text-[16px] font-light">Diacritics</h3>
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
                    applicableIdsRef.current = new Set()
                    setApplicablePhonemeIds(new Set())
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault()
                    const displaySymbol = d.symbol.codePointAt(0) === 0x0320 ? '_' : d.symbol
                    touchDraggingRef.current = { id: d.id, displaySymbol }
                    setDraggingDiacriticId(d.id)
                    const t = e.touches[0]
                    setTouchIndicatorPos({ x: t.clientX, y: t.clientY })
                  }}
                  onTouchMove={(e) => {
                    const t = e.touches[0]
                    setTouchIndicatorPos({ x: t.clientX, y: t.clientY })
                  }}
                  onTouchEnd={(e) => {
                    const t = e.changedTouches[0]
                    const el = document.elementFromPoint(t.clientX, t.clientY)
                    const target = el?.closest('[data-phoneme-symbol]')
                    const sym = target?.dataset?.phonemeSymbol
                    const diacriticId = touchDraggingRef.current?.id
                    if (sym && diacriticId != null) {
                      const phoneme = phonemesBySymbol[sym.trim()]
                      if (phoneme && applicableIdsRef.current.has(phoneme.id)) {
                        onDropSymbol(sym, diacriticId)
                      } else if (phoneme) {
                        onInvalidDropSymbol(sym, diacriticId)
                      }
                    }
                    resetTouchDrag()
                  }}
                  onTouchCancel={resetTouchDrag}
                  className={`w-9 h-8 border rounded flex items-center justify-center text-[16px] select-none cursor-grab active:cursor-grabbing ${
                    draggingDiacriticId === d.id
                      ? 'border-blue-100 bg-blue-100'
                      : isDark
                      ? 'border-slate-200 text-black bg-white hover:bg-gray-300'
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
          <p className={`text-[12px] font-light ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Drag a diacritic onto a compatible phoneme to add it to the inventory.
          </p>
          </div>
        </section>
      </div>

      {/* ── Scrollable tables ── */}
      <div className="relative flex-1">
        {loadingApplicable && (
          <div className={`absolute inset-0 z-10 flex items-center justify-center ${isDark ? 'bg-[#0E1116]/60' : 'bg-white/60'}`}>
            <span className="text-sm text-slate-600">Loading valid targets...</span>
          </div>
        )}
      <div className="absolute inset-0 overflow-y-auto space-y-[32px]">

      <IpaTableGrid
        activeManners={MANNERS}
        activePlaces={PLACES}
        activeVowelHeights={VOWEL_HEIGHTS}
        activeVowelBackness={VOWEL_BACKNESS}
        activeOtherGroups={OTHER_PHONEME_GROUPS}
        diacriticRowsByConsonant={diacriticRowsByConsonant}
        diacriticRowsByVowel={diacriticRowsByVowel}
        diacriticRowsByOther={diacriticRowsByOther}
        renderSymbol={renderSymbolButton}
        renderDiacriticChip={(item) => (
          <DiacriticChip key={item.key} item={item} onRemove={toggleInventory} isDragging={!!draggingDiacriticId} />
        )}
        cellWidth="w-28"
        slotWidth="w-14"
      />
      </div>
      </div>

      {/* Touch drag floating indicator */}
      {touchIndicatorPos && touchDraggingRef.current && (
        <div
          className="fixed z-50 pointer-events-none w-9 h-8 border border-blue-400 bg-blue-100 rounded flex items-center justify-center text-[16px] font-mono opacity-80 select-none"
          style={{ left: touchIndicatorPos.x - 18, top: touchIndicatorPos.y - 16 }}
        >
          {touchDraggingRef.current.displaySymbol}
        </div>
      )}
    </div>
  )
}
