import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'

import { useReactiveMediaQuery } from '../useReactiveMediaQuery'
import { useBreakpoint } from '../useBreakpoint'
import { useVisibility } from '../useVisibility'
import { usePointerType } from '../usePointerType'
import { pickEvenlyDistributed } from '../utils/pickEvenlyDistributed'

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/**
 * Builds a fake MediaQueryList factory keyed by query string. Each call to
 * `matchMedia(query)` produces a deterministic MQL whose `matches` value and
 * listener tracking can be inspected from the test.
 */
const createMatchMediaFactory = (resolveMatches) => {
  const created = new Map()

  const factory = vi.fn((query) => {
    if (created.has(query)) return created.get(query)
    const listeners = new Set()
    const mql = {
      matches: resolveMatches(query),
      media: query,
      addEventListener: vi.fn((event, handler) => {
        if (event === 'change') listeners.add(handler)
      }),
      removeEventListener: vi.fn((event, handler) => {
        if (event === 'change') listeners.delete(handler)
      }),
      // legacy API surface — some libraries still poke at these
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      _emit: (matches) => {
        mql.matches = matches
        for (const handler of listeners) handler({ matches })
      },
      _listenerCount: () => listeners.size
    }
    created.set(query, mql)
    return mql
  })

  return { factory, created }
}

const installMatchMedia = (resolveMatches) => {
  const { factory, created } = createMatchMediaFactory(resolveMatches)
  vi.stubGlobal('matchMedia', factory)
  // jsdom exposes matchMedia on window — keep both in sync
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: factory
    })
  }
  return { factory, created }
}

const widthMatcher = (width) => (query) => {
  const max = /max-width:\s*(\d+)px/.exec(query)
  if (max) return width <= Number(max[1])
  const min = /min-width:\s*(\d+)px/.exec(query)
  if (min) return width >= Number(min[1])
  return false
}

/**
 * Mount a tiny harness component whose `setup()` invokes the composable
 * once and exposes its return value. This is the canonical way to test a
 * Composition API composable that uses lifecycle hooks (onMounted,
 * onBeforeUnmount, onActivated, onDeactivated).
 */
const harness = (factory) => {
  let api
  const Component = defineComponent({
    setup() {
      api = factory()
      return () => h('div')
    }
  })
  const wrapper = mount(Component)
  return {
    wrapper,
    get api() {
      return api
    }
  }
}

/* ------------------------------------------------------------------ */
/* useReactiveMediaQuery                                               */
/* ------------------------------------------------------------------ */

describe('useReactiveMediaQuery', () => {
  let media

  beforeEach(() => {
    media = installMatchMedia(widthMatcher(500))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('returns a ref reflecting the initial mql.matches value', () => {
    const { wrapper, api } = harness(() => useReactiveMediaQuery('(max-width: 639px)'))
    expect(api.value).toBe(true)
    wrapper.unmount()
  })

  it('returns false when the query does not match', () => {
    const { wrapper, api } = harness(() => useReactiveMediaQuery('(max-width: 400px)'))
    expect(api.value).toBe(false)
    wrapper.unmount()
  })

  it('updates reactively when the underlying media query changes', async () => {
    const { wrapper, api } = harness(() => useReactiveMediaQuery('(max-width: 639px)'))
    expect(api.value).toBe(true)

    const mql = media.created.get('(max-width: 639px)')
    mql._emit(false)
    await nextTick()

    expect(api.value).toBe(false)

    mql._emit(true)
    await nextTick()
    expect(api.value).toBe(true)

    wrapper.unmount()
  })

  it('does not accumulate listeners across mount/unmount/mount cycles', () => {
    const query = '(max-width: 639px)'

    const first = harness(() => useReactiveMediaQuery(query))
    const mqlFirst = media.created.get(query)
    expect(mqlFirst.addEventListener).toHaveBeenCalledTimes(1)
    expect(mqlFirst._listenerCount()).toBe(1)

    first.wrapper.unmount()
    expect(mqlFirst.removeEventListener).toHaveBeenCalledTimes(1)
    expect(mqlFirst._listenerCount()).toBe(0)

    const second = harness(() => useReactiveMediaQuery(query))
    // The composable creates its own MQL each mount (mql = null after teardown),
    // so the second mount produces a fresh MediaQueryList via the factory.
    // What matters is that after a full cycle no stale listener remains on any
    // previously-created MQL.
    const mqlSecond = media.created.get(query)
    expect(mqlSecond._listenerCount()).toBe(1)

    second.wrapper.unmount()
    expect(mqlSecond._listenerCount()).toBe(0)
  })
})

/* ------------------------------------------------------------------ */
/* useBreakpoint                                                       */
/* ------------------------------------------------------------------ */

describe('useBreakpoint', () => {
  let mounted

  const setupAt = (width) => {
    installMatchMedia(widthMatcher(width))
    mounted = harness(() => useBreakpoint())
    return mounted.api
  }

  afterEach(() => {
    if (mounted) {
      mounted.wrapper.unmount()
      mounted = null
    }
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('resolves token to "mobile-s" at 320px', () => {
    const { current } = setupAt(320)
    expect(current.value).toBe('mobile-s')
  })

  it('resolves token to "mobile" at 500px', () => {
    const { current } = setupAt(500)
    expect(current.value).toBe('mobile')
  })

  it('resolves token to "tablet" at 800px', () => {
    const { current } = setupAt(800)
    expect(current.value).toBe('tablet')
  })

  it('resolves token to "desktop" at 1200px', () => {
    const { current } = setupAt(1200)
    expect(current.value).toBe('desktop')
  })

  it('resolves token to "xl" at 1600px', () => {
    const { current } = setupAt(1600)
    expect(current.value).toBe('xl')
  })

  it('is(token) returns true only for the matching token', () => {
    const { is } = setupAt(800)
    expect(is('tablet').value).toBe(true)
    expect(is('mobile').value).toBe(false)
    expect(is('xl').value).toBe(false)
  })

  it('isAtMost respects token order', () => {
    const { isAtMost } = setupAt(800) // tablet
    expect(isAtMost('mobile-s').value).toBe(false)
    expect(isAtMost('mobile').value).toBe(false)
    expect(isAtMost('tablet').value).toBe(true)
    expect(isAtMost('desktop').value).toBe(true)
    expect(isAtMost('xl').value).toBe(true)
  })

  it('isAtLeast respects token order', () => {
    const { isAtLeast } = setupAt(800) // tablet
    expect(isAtLeast('mobile-s').value).toBe(true)
    expect(isAtLeast('mobile').value).toBe(true)
    expect(isAtLeast('tablet').value).toBe(true)
    expect(isAtLeast('desktop').value).toBe(false)
    expect(isAtLeast('xl').value).toBe(false)
  })

  it('returns false for unknown tokens across is/isAtMost/isAtLeast', () => {
    const { is, isAtMost, isAtLeast } = setupAt(800)
    expect(is('does-not-exist').value).toBe(false)
    expect(isAtMost('does-not-exist').value).toBe(false)
    expect(isAtLeast('does-not-exist').value).toBe(false)
  })
})

/* ------------------------------------------------------------------ */
/* useVisibility                                                       */
/* ------------------------------------------------------------------ */

describe('useVisibility', () => {
  let visibilityState
  let listeners
  let addSpy
  let removeSpy
  let originalDescriptor

  const setVisibility = (next) => {
    visibilityState = next
    // Fire the change synchronously to mirror real browser behaviour
    for (const handler of [...listeners]) handler()
  }

  beforeEach(() => {
    visibilityState = 'visible'
    listeners = new Set()

    originalDescriptor = Object.getOwnPropertyDescriptor(document, 'visibilityState')
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibilityState
    })

    const realAdd = document.addEventListener.bind(document)
    const realRemove = document.removeEventListener.bind(document)

    addSpy = vi
      .spyOn(document, 'addEventListener')
      .mockImplementation((event, handler, options) => {
        if (event === 'visibilitychange') {
          listeners.add(handler)
          return undefined
        }
        return realAdd(event, handler, options)
      })

    removeSpy = vi
      .spyOn(document, 'removeEventListener')
      .mockImplementation((event, handler, options) => {
        if (event === 'visibilitychange') {
          listeners.delete(handler)
          return undefined
        }
        return realRemove(event, handler, options)
      })
  })

  afterEach(() => {
    if (originalDescriptor) {
      Object.defineProperty(document, 'visibilityState', originalDescriptor)
    } else {
      delete document.visibilityState
    }
    vi.restoreAllMocks()
  })

  it('isHidden flips when document.visibilityState changes', async () => {
    const { wrapper, api } = harness(() => useVisibility())
    expect(api.isHidden.value).toBe(false)

    setVisibility('hidden')
    await nextTick()
    expect(api.isHidden.value).toBe(true)

    setVisibility('visible')
    await nextTick()
    expect(api.isHidden.value).toBe(false)

    wrapper.unmount()
  })

  it('onVisible(cb) fires cb on hidden→visible transition', async () => {
    const { wrapper, api } = harness(() => useVisibility())
    const cb = vi.fn()
    api.onVisible(cb)

    setVisibility('hidden')
    await nextTick()
    expect(cb).not.toHaveBeenCalled()

    setVisibility('visible')
    await nextTick()
    expect(cb).toHaveBeenCalledTimes(1)

    wrapper.unmount()
  })

  it('does NOT fire onVisible callbacks on visible→hidden transition', async () => {
    const { wrapper, api } = harness(() => useVisibility())
    const cb = vi.fn()
    api.onVisible(cb)

    setVisibility('hidden')
    await nextTick()
    expect(cb).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('clears callbacks array on unmount (old callbacks do not fire on next mount)', async () => {
    const first = harness(() => useVisibility())
    const staleCb = vi.fn()
    first.api.onVisible(staleCb)
    first.wrapper.unmount()

    // Re-mount fresh
    const second = harness(() => useVisibility())
    setVisibility('hidden')
    await nextTick()
    setVisibility('visible')
    await nextTick()

    expect(staleCb).not.toHaveBeenCalled()

    second.wrapper.unmount()
  })

  it('keeps listener count on document stable across 10 mount/unmount cycles', () => {
    for (let cycle = 0; cycle < 10; cycle++) {
      const { wrapper } = harness(() => useVisibility())
      expect(listeners.size).toBe(1)
      wrapper.unmount()
      expect(listeners.size).toBe(0)
    }
    expect(addSpy).toHaveBeenCalledTimes(10)
    expect(removeSpy).toHaveBeenCalledTimes(10)
  })
})

/* ------------------------------------------------------------------ */
/* usePointerType                                                      */
/* ------------------------------------------------------------------ */

describe('usePointerType', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('isCoarse is true when matchMedia("(pointer: coarse)") matches', () => {
    installMatchMedia((query) => query.includes('coarse'))
    const { wrapper, api } = harness(() => usePointerType())
    expect(api.isCoarse.value).toBe(true)
    expect(api.isFine.value).toBe(false)
    wrapper.unmount()
  })

  it('isFine is true when matchMedia("(pointer: fine)") matches', () => {
    installMatchMedia((query) => query.includes('fine'))
    const { wrapper, api } = harness(() => usePointerType())
    expect(api.isFine.value).toBe(true)
    expect(api.isCoarse.value).toBe(false)
    wrapper.unmount()
  })

  it('both can be true simultaneously (iPad with Magic Keyboard)', () => {
    installMatchMedia((query) => query.includes('coarse') || query.includes('fine'))
    const { wrapper, api } = harness(() => usePointerType())
    expect(api.isCoarse.value).toBe(true)
    expect(api.isFine.value).toBe(true)
    wrapper.unmount()
  })

  it('both can be false (server-like environment or no pointer)', () => {
    installMatchMedia(() => false)
    const { wrapper, api } = harness(() => usePointerType())
    expect(api.isCoarse.value).toBe(false)
    expect(api.isFine.value).toBe(false)
    wrapper.unmount()
  })
})

/* ------------------------------------------------------------------ */
/* pickEvenlyDistributed                                               */
/* ------------------------------------------------------------------ */

describe('pickEvenlyDistributed', () => {
  it('returns [] for empty input regardless of targetCount', () => {
    expect(pickEvenlyDistributed([], 5)).toEqual([])
  })

  it('returns [] when targetCount is 0', () => {
    expect(pickEvenlyDistributed([1, 2, 3], 0)).toEqual([])
  })

  it('returns a copy of items when length <= targetCount', () => {
    expect(pickEvenlyDistributed([1, 2, 3], 5)).toEqual([1, 2, 3])
  })

  it('targetCount=1 with preserveFirst returns first item', () => {
    expect(pickEvenlyDistributed([1, 2, 3], 1, { preserveFirst: true })).toEqual([1])
  })

  it('targetCount=1 with preserveLast returns last item', () => {
    expect(pickEvenlyDistributed([1, 2, 3], 1, { preserveLast: true })).toEqual([3])
  })

  it('picks [1, 4, 7] from [1..7] with target 3 and both preserve flags', () => {
    const result = pickEvenlyDistributed([1, 2, 3, 4, 5, 6, 7], 3, {
      preserveFirst: true,
      preserveLast: true
    })
    expect(result).toEqual([1, 4, 7])
  })

  it('picks [1, 5] from [1..5] with target 2 and both preserve flags', () => {
    const result = pickEvenlyDistributed([1, 2, 3, 4, 5], 2, {
      preserveFirst: true,
      preserveLast: true
    })
    expect(result).toEqual([1, 5])
  })

  it('picks [1, 4, 7, 10] from [1..10] with target 4 and both preserve flags', () => {
    const result = pickEvenlyDistributed([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 4, {
      preserveFirst: true,
      preserveLast: true
    })
    expect(result).toEqual([1, 4, 7, 10])
  })

  it('does not mutate the input array', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const snapshot = JSON.parse(JSON.stringify(input))
    pickEvenlyDistributed(input, 4, { preserveFirst: true, preserveLast: true })
    expect(input).toEqual(snapshot)
  })

  it('returns ascending indices without duplicates', () => {
    const result = pickEvenlyDistributed([10, 20, 30, 40, 50], 3, {
      preserveFirst: true,
      preserveLast: true
    })
    const unique = new Set(result)
    expect(unique.size).toBe(result.length)
    for (let idx = 1; idx < result.length; idx++) {
      expect(result[idx]).toBeGreaterThan(result[idx - 1])
    }
  })
})
