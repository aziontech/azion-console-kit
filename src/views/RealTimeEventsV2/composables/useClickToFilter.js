/**
 * Composable that returns event handlers for click-to-filter behaviour on
 * value spans. Emits add-filter on plain click and exclude-filter on Alt+click,
 * but only when:
 *   - the value passes the isValid gate (Requirement 5.7)
 *   - the click did not produce a text selection (Requirement 5.5)
 *   - the pointer did not drag more than 3px (text-drag guard)
 *
 * @param {Object} opts
 * @param {(key: string, value: any) => void} opts.onAdd
 * @param {(key: string, value: any) => void} opts.onExclude
 * @param {(value: any) => boolean} [opts.isValid]
 * @returns {{ onValueMouseDown, onValueMouseUp, onValueClick }}
 */

/**
 * Default validity gate — mirrors the existing `isValidValue` check used
 * throughout the Real-Time Events module.
 *
 * Rejects: null, undefined, empty string, the placeholder dash '-', and any
 * string that is entirely whitespace.
 *
 * @param {any} value
 * @returns {boolean}
 */
function defaultIsValid(value) {
  if (value === null || value === undefined) return false
  const str = String(value).trim()
  return str !== '' && str !== '-'
}

export function useClickToFilter({ onAdd, onExclude, isValid }) {
  const isValidFn = typeof isValid === 'function' ? isValid : defaultIsValid

  /**
   * Step 1 — record the pointer-down position on the element so that
   * onValueMouseUp can measure how far the pointer travelled.
   *
   * @param {MouseEvent} event
   */
  function onValueMouseDown(event) {
    // stopImmediatePropagation prevents PrimeVue DataTable's row-level
    // mousedown listener from calling preventDefault(), which would kill
    // the browser's native text-selection drag. We do NOT call
    // preventDefault() ourselves so the browser can start a selection.
    event.stopImmediatePropagation()
    /* eslint-disable id-length */
    event.currentTarget.__clickStart = {
      x: event.clientX,
      y: event.clientY
    }
    /* eslint-enable id-length */
  }

  /**
   * Step 2 — if the pointer moved more than 3 px since mousedown, mark the
   * element as having been dragged so that onValueClick can skip the filter
   * action (the user was selecting text, not clicking).
   *
   * @param {MouseEvent} event
   */
  function onValueMouseUp(event) {
    event.stopImmediatePropagation()
    const start = event.currentTarget.__clickStart
    if (!start) return

    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance > 3) {
      event.currentTarget.__draggedOut = true
    }
  }

  /**
   * Step 3 — decide whether to emit add-filter or exclude-filter, or to
   * silently bail out when the click should not trigger a filter action.
   *
   * Gate order (first matching gate wins):
   *   1. Invalid value  → return (Requirement 5.7)
   *   2. Dragged out    → clear flag and return (text-drag guard)
   *   3. Non-collapsed selection → return (Requirement 5.5)
   *   4. Alt key held   → onExclude (Requirement 5.2)
   *   5. Plain click    → onAdd (Requirement 5.1)
   *
   * @param {MouseEvent} event
   * @param {string} key
   * @param {any} value
   */
  function onValueClick(event, key, value) {
    // Gate 1: invalid value
    if (!isValidFn(value)) return

    // Gate 2: pointer was dragged (text-drag guard)
    if (event.currentTarget.__draggedOut) {
      event.currentTarget.__draggedOut = false
      return
    }

    // Gate 3: text selection is active (Requirement 5.5).
    // When the selection's anchor/focus is contained inside the click target,
    // the click is part of a text-drag on this element → always block.
    // When the anchor/focus exists and is clearly OUTSIDE this element, the
    // selection belongs to an unrelated surface → allow the click through so
    // stale selections elsewhere don't suppress the filter action.
    // When anchor/focus cannot be resolved (e.g. non-DOM targets in tests),
    // fall back to blocking to preserve the original conservative contract.
    const selection = typeof window !== 'undefined' ? window.getSelection() : null
    if (selection !== null && !selection.isCollapsed) {
      const target = event.currentTarget
      const anchor = selection.anchorNode
      const focus = selection.focusNode
      const canResolve = (anchor || focus) && target && typeof target.contains === 'function'
      if (!canResolve) return
      const selectionInTarget =
        (anchor && target.contains(anchor)) || (focus && target.contains(focus))
      if (selectionInTarget) return
    }

    // Route to the appropriate callback
    if (event.altKey) {
      onExclude(key, value)
    } else {
      onAdd(key, value)
    }
  }

  return { onValueMouseDown, onValueMouseUp, onValueClick }
}
