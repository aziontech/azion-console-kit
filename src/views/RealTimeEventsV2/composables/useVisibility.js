import { ref, computed, onMounted, onBeforeUnmount, onActivated, onDeactivated } from 'vue'

/**
 * Reactive wrapper over `document.visibilityState`.
 *
 * Designed for components under `<keep-alive>`: listeners are attached on
 * both `onMounted`/`onActivated` and detached on `onBeforeUnmount`/
 * `onDeactivated` using the same named handler reference, with the
 * callbacks array cleared on teardown to avoid cross-mount accumulation.
 *
 * @returns {{
 *   state: import('vue').Ref<'visible' | 'hidden'>,
 *   isHidden: import('vue').ComputedRef<boolean>,
 *   onVisible: (cb: () => void) => void
 * }}
 */
export function useVisibility() {
  const state = ref(typeof document !== 'undefined' ? document.visibilityState : 'visible')
  const isHidden = computed(() => state.value === 'hidden')
  const callbacks = []

  const onVisibilityChange = () => {
    const next = document.visibilityState
    const wasHidden = state.value === 'hidden'
    state.value = next
    if (wasHidden && next === 'visible') {
      for (const cb of callbacks) cb()
    }
  }

  /** Registers a callback fired on every hidden→visible transition until teardown. */
  const onVisible = (cb) => {
    callbacks.push(cb)
  }

  const setup = () => {
    state.value = document.visibilityState
    document.addEventListener('visibilitychange', onVisibilityChange)
  }

  const teardown = () => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
    callbacks.length = 0
  }

  onMounted(setup)
  onActivated(setup)
  onBeforeUnmount(teardown)
  onDeactivated(teardown)

  return { state, isHidden, onVisible }
}
