import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchApplicablePhonemes, isAbort } from '../api.js'

/*
01. DIACRITIC DISPLAY SYMBOL
    The symbol shown on a diacritic's tile (the real symbol is still used when it's applied)
*/
export const diacriticDisplaySymbol = (diacritic) =>
  
  // postalveolar and backed velar render as the same symbol in the frontend until it is applied
  // (for some reason the symbol for backed velar won't show unless it's attached to something)
  diacritic.symbol.codePointAt(0) === 0x0320 ? '_' : diacritic.symbol

/*
02. USE DIACRITIC DRAG
    Handles dragging a diacritic onto a sound, with mouse or touchscreen
*/
export function useDiacriticDrag({ phonemes, phonemesBySymbol }) {
  
  // Which diacritic is being dragged right now (null = none)
  const [draggingDiacriticId, setDraggingDiacriticId] = useState(null)
  
  // The sounds the dragged diacritic is allowed to go on
  const [applicablePhonemeIds, setApplicablePhonemeIds] = useState(new Set())
  
  // A copy of the list above that touch handlers can always read up to date
  const applicableIdsRef = useRef(new Set())
  const [loadingApplicable, setLoadingApplicable] = useState(false)
  const [touchIndicator, setTouchIndicator] = useState(null)

  const setApplicable = useCallback((ids) => {
    applicableIdsRef.current = ids
    setApplicablePhonemeIds(ids)
  }, [])

  // Stops any drag: nothing is being dragged and no sounds are highlighted
  const endDrag = useCallback(() => {
    setDraggingDiacriticId(null)
    setApplicable(new Set())
  }, [setApplicable])

  const resetTouchDrag = () => {
    endDrag()
    setTouchIndicator(null)
  }

  /* VALID TARGETS: when a drag starts, ask the backend which sounds the diacritic can go on */
  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    const evaluateCompatibility = async () => {
      if (!draggingDiacriticId) {
        setApplicable(new Set())
        setLoadingApplicable(false)
        return
      }
      setLoadingApplicable(true)
      try {
        setApplicable(new Set(await fetchApplicablePhonemes(draggingDiacriticId, { signal })))
      } catch (e) {
        if (isAbort(e)) return
        console.error(e)
        // If the lookup fails, allow dropping anywhere rather than blocking the user
        setApplicable(new Set(phonemes.map((p) => p.id)))
      } finally {
        // A cancelled request was replaced by a newer drag, which handles the loading flag
        if (!signal.aborted) setLoadingApplicable(false)
      }
    }
    evaluateCompatibility()
    return () => controller.abort()
  }, [phonemes, draggingDiacriticId, setApplicable])

  /* TOUCH DRAG (for mobile): stop the page from scrolling while a diacritic is being dragged by finger */
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
      // Finger lifted: find which sound (if any) is underneath, and drop there
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
