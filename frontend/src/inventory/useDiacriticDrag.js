import { useCallback, useEffect, useRef, useState } from 'react'
import { postJson } from '../api.js'

// postalv / backed-velar diacritics render incorrectly on their own because the unicode
// symbol needs a base char, so show _ instead (the real symbol is still used when applying)
export const diacriticDisplaySymbol = (diacritic) =>
  diacritic.symbol.codePointAt(0) === 0x0320 ? '_' : diacritic.symbol

// Drag state for diacritics, with mouse (HTML5 drag) and touch support.
//   - while a diacritic is dragged, POST /diacritics/applicable-phonemes returns the phoneme ids
//     it can be applied to; those become valid drop targets (applicablePhonemeIds)
//   - dragHandlers(diacritic, { onDrop, onInvalidDrop }) returns the props for a draggable chip.
//     onDrop/onInvalidDrop are called as (phonemeSymbol, diacriticId) on a touch release
//   - touchIndicator is { x, y, displaySymbol } while a touch drag is in progress, else null
export function useDiacriticDrag({ phonemes, phonemesBySymbol }) {
  // which diacritic is currently being dragged?
  const [draggingDiacriticId, setDraggingDiacriticId] = useState(null)
  // the phonemes that can receive the dragged diacritic
  const [applicablePhonemeIds, setApplicablePhonemeIds] = useState(new Set())
  // ref mirror of applicablePhonemeIds for use in touch handlers (avoids stale closures)
  const applicableIdsRef = useRef(new Set())
  const [loadingApplicable, setLoadingApplicable] = useState(false)
  const [touchIndicator, setTouchIndicator] = useState(null)

  const setApplicable = useCallback((ids) => {
    applicableIdsRef.current = ids
    setApplicablePhonemeIds(ids)
  }, [])

  // ends any drag: nothing is being dragged and no phonemes are highlighted
  const endDrag = useCallback(() => {
    setDraggingDiacriticId(null)
    setApplicable(new Set())
  }, [setApplicable])

  const resetTouchDrag = () => {
    endDrag()
    setTouchIndicator(null)
  }

  /* DIACRITIC TARGETS: fetch which phonemes are valid drop targets */
  useEffect(() => {
    const evaluateCompatibility = async () => {
      if (!draggingDiacriticId) {
        setApplicable(new Set())
        setLoadingApplicable(false)
        return
      }
      setLoadingApplicable(true)
      try {
        const data = await postJson('/diacritics/applicable-phonemes', { diacritic_id: draggingDiacriticId })
        setApplicable(new Set(Array.isArray(data.phoneme_ids) ? data.phoneme_ids : []))
      } catch (e) {
        console.error(e)
        setApplicable(new Set(phonemes.map((p) => p.id)))
      } finally {
        setLoadingApplicable(false)
      }
    }
    evaluateCompatibility()
  }, [phonemes, draggingDiacriticId, setApplicable])

  /* TOUCH DRAG: prevent page scroll while a diacritic is being touch-dragged */
  useEffect(() => {
    if (!draggingDiacriticId) return
    const prevent = (e) => e.preventDefault()
    document.addEventListener('touchmove', prevent, { passive: false })
    return () => document.removeEventListener('touchmove', prevent)
  }, [draggingDiacriticId])

  const dragHandlers = (d, { onDrop, onInvalidDrop }) => ({
    draggable: true,
    onDragStart: (e) => {
      e.dataTransfer.setData('diacritic_id', d.id)
      e.dataTransfer.effectAllowed = 'copy'
      setDraggingDiacriticId(d.id)
    },
    onDragEnd: endDrag,
    onTouchStart: (e) => {
      e.preventDefault()
      setDraggingDiacriticId(d.id)
      const t = e.touches[0]
      setTouchIndicator({ x: t.clientX, y: t.clientY, displaySymbol: diacriticDisplaySymbol(d) })
    },
    onTouchMove: (e) => {
      const t = e.touches[0]
      setTouchIndicator((prev) => prev && { ...prev, x: t.clientX, y: t.clientY })
    },
    onTouchEnd: (e) => {
      const t = e.changedTouches[0]
      const el = document.elementFromPoint(t.clientX, t.clientY)
      const sym = el?.closest('[data-phoneme-symbol]')?.dataset?.phonemeSymbol
      if (sym) {
        const phoneme = phonemesBySymbol[sym.trim()]
        if (phoneme && applicableIdsRef.current.has(phoneme.id)) {
          onDrop(sym, d.id)
        } else if (phoneme) {
          onInvalidDrop(sym, d.id)
        }
      }
      resetTouchDrag()
    },
    onTouchCancel: resetTouchDrag,
  })

  return {
    draggingDiacriticId,
    applicablePhonemeIds,
    loadingApplicable,
    touchIndicator,
    endDrag,
    dragHandlers,
  }
}
