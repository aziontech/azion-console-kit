import { nextTick, onBeforeUnmount, onDeactivated, ref, unref } from 'vue'

/**
 * Focus-trap for modal-style surfaces (dialogs, bottom-sheets).
 *
 * A trap keeps keyboard focus inside a container while it is open: Tab from the
 * last focusable wraps to the first, Shift+Tab from the first wraps to the last,
 * and focus that somehow escaped the container is pulled back in. On deactivate
 * it restores focus to where the user was (or to an explicit return target such
 * as the trigger), so keyboard users are never dropped at the top of the page.
 *
 * Use this ONLY for surfaces that are genuinely modal (bottom-sheets, dialogs).
 * Inline panes (e.g. a detail sidebar rendered in the document flow) must NOT be
 * trapped — trapping them would break normal page navigation. See design §7.3.
 *
 * Leak discipline: the single `keydown` listener is added on `activate` and
 * removed on `deactivate`; the composable also wires `onBeforeUnmount` and
 * `onDeactivated` (keep-alive) to `deactivate`, so the listener can never
 * outlive a live period. `activate`/`deactivate` are idempotent — guarded by an
 * internal `active` flag — so callers may invoke them on any close path.
 *
 * @param {import('vue').Ref<HTMLElement | null> | (() => HTMLElement | null)} containerRef
 *   Ref (or getter) to the trap root. Read lazily on each keystroke, so it may
 *   be `null` until the surface renders (e.g. behind a `v-if`).
 * @param {object} [options]
 * @param {(() => void) | null} [options.onEscape] Invoked when Escape is pressed
 *   while the trap is active (typically closes the surface). When provided, the
 *   Escape keydown is `preventDefault`-ed.
 * @param {import('vue').Ref<HTMLElement | null> | null} [options.initialFocus]
 *   Element to focus when the trap activates (e.g. the sheet's close button).
 *   Falls back to the first focusable inside the container.
 * @param {import('vue').Ref<HTMLElement | null> | null} [options.returnFocusTo]
 *   Element to focus on deactivate (e.g. the trigger). Falls back to whatever
 *   was focused when the trap activated.
 * @returns {{
 *   activate: () => void,
 *   deactivate: () => void,
 *   isActive: import('vue').Ref<boolean>
 * }}
 */
export function useFocusTrap(containerRef, options = {}) {
  const { onEscape = null, initialFocus = null, returnFocusTo = null } = options

  const active = ref(false)
  const previouslyFocused = ref(null)

  const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ')

  const getRoot = () => unref(containerRef) || null

  const getFocusable = () => {
    const root = getRoot()
    if (!root) return []
    return Array.from(root.querySelectorAll(FOCUSABLE_SELECTOR))
  }

  // Single named handler so add/removeEventListener share the exact reference —
  // an anonymous listener would silently leak across open/close cycles.
  const onKeydown = (event) => {
    if (event.key === 'Escape') {
      if (onEscape) {
        event.preventDefault()
        onEscape()
      }
      return
    }
    if (event.key !== 'Tab') return

    const focusables = getFocusable()
    if (!focusables.length) return

    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    const root = getRoot()
    const activeEl = document.activeElement
    const outside = !root || !root.contains(activeEl)

    if (event.shiftKey) {
      if (activeEl === first || outside) {
        event.preventDefault()
        last.focus()
      }
    } else if (activeEl === last || outside) {
      event.preventDefault()
      first.focus()
    }
  }

  const activate = () => {
    if (active.value) return
    previouslyFocused.value =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.addEventListener('keydown', onKeydown)
    active.value = true
    nextTick(() => {
      const target = unref(initialFocus) || getFocusable()[0] || null
      target?.focus?.()
    })
  }

  const deactivate = () => {
    if (!active.value) return
    document.removeEventListener('keydown', onKeydown)
    active.value = false
    const target = unref(returnFocusTo) || previouslyFocused.value
    previouslyFocused.value = null
    if (target && typeof target.focus === 'function') {
      try {
        target.focus()
      } catch {
        /* element may have been unmounted */
      }
    }
  }

  // Symmetric teardown for both plain unmount and keep-alive deactivate, so the
  // listener never survives the component's live period.
  onBeforeUnmount(deactivate)
  onDeactivated(deactivate)

  return { activate, deactivate, isActive: active }
}
