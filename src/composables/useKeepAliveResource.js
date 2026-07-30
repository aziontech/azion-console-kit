import { ref, onMounted, onActivated, onBeforeUnmount, onDeactivated } from 'vue'

/**
 * Owns the symmetric lifecycle for a keep-alive-safe resource.
 *
 * A "resource" is anything that must be acquired when the component becomes
 * live (mount or keep-alive activate) and released when it goes away (unmount
 * or keep-alive deactivate): ResizeObservers, event listeners, timers, etc.
 *
 * Under `<KeepAlive>`, a component is not unmounted when it is hidden — it is
 * *deactivated*. A resource wired only to `onMounted`/`onBeforeUnmount` would
 * therefore leak across activate/deactivate cycles. This composable guarantees
 * the acquire/release pair fires exactly once per live period, in both the
 * mount and the keep-alive paths.
 *
 * Guarantees:
 * - `acquire` runs on `onMounted` and `onActivated`, but only while inactive
 *   (never double-acquires — at most one live handle at a time).
 * - `release` runs on `onBeforeUnmount` and `onDeactivated`, but only while
 *   active (never double-releases; no-op when nothing is held).
 * - `release` is wrapped in `try/finally` so the handle and active flag are
 *   always reset, even if `release` throws (error path stays clean — no stuck
 *   "active" state that would block re-acquisition).
 * - SSR-safe: the module performs no `window`/DOM access at load time; any
 *   environment guard belongs inside the caller's `acquire`.
 *
 * @template H
 * @param {() => (H | void)} acquire - Creates the resource; its return value is
 *   stored as the handle and passed back to `release`. May return nothing.
 * @param {(handle: H | null) => void} release - Tears down the resource. Receives
 *   the handle returned by `acquire` (or `null` if `acquire` returned nothing).
 * @returns {{
 *   isActive: import('vue').Ref<boolean>,
 *   forceAcquire: () => void,
 *   forceRelease: () => void
 * }} Reactive `isActive` flag plus manual acquire/release escape hatches (both
 *   honor the same inactive/active guards as the automatic hooks).
 */
export function useKeepAliveResource(acquire, release) {
  let handle = null
  const active = ref(false)

  const doAcquire = () => {
    if (active.value) return
    handle = acquire() ?? null
    active.value = true
  }

  const doRelease = () => {
    if (!active.value) return
    try {
      release(handle)
    } finally {
      handle = null
      active.value = false
    }
  }

  onMounted(doAcquire)
  onActivated(doAcquire)
  onBeforeUnmount(doRelease)
  onDeactivated(doRelease)

  return {
    isActive: active,
    forceAcquire: doAcquire,
    forceRelease: doRelease
  }
}
