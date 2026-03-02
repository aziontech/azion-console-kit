import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'

vi.mock('vue-router', () => ({
  onBeforeRouteLeave: vi.fn(),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    currentRoute: { value: { name: 'test-route' } }
  }))
}))

describe('useUnsavedChanges', () => {
  let mockRouterPush

  beforeEach(() => {
    mockRouterPush = vi.fn()
    vi.mocked(useRouter).mockReturnValue({
      push: mockRouterPush,
      currentRoute: { value: { name: 'test-route' } }
    })
  })

  describe('isDirty', () => {
    it('should return false when no dirty sources are registered', () => {
      const { isDirty } = useUnsavedChanges({ enableRouteGuard: false, enableBeforeUnload: false })

      expect(isDirty.value).toBe(false)
    })

    it('should return true when a ref dirty source is true', () => {
      const { isDirty, addDirtySource } = useUnsavedChanges({
        enableRouteGuard: false,
        enableBeforeUnload: false
      })
      const dirtyFlag = ref(true)
      addDirtySource(dirtyFlag)

      expect(isDirty.value).toBe(true)
    })

    it('should return false when a ref dirty source is false', () => {
      const { isDirty, addDirtySource } = useUnsavedChanges({
        enableRouteGuard: false,
        enableBeforeUnload: false
      })
      const dirtyFlag = ref(false)
      addDirtySource(dirtyFlag)

      expect(isDirty.value).toBe(false)
    })

    it('should work with function dirty sources that read reactive state', () => {
      const { isDirty, addDirtySource } = useUnsavedChanges({
        enableRouteGuard: false,
        enableBeforeUnload: false
      })
      const dirtyState = ref(false)
      addDirtySource(() => dirtyState.value)

      expect(isDirty.value).toBe(false)

      dirtyState.value = true
      expect(isDirty.value).toBe(true)
    })

    it('should return false after unregistering a dirty source', () => {
      const { isDirty, addDirtySource } = useUnsavedChanges({
        enableRouteGuard: false,
        enableBeforeUnload: false
      })
      const dirtyFlag = ref(true)
      const unregister = addDirtySource(dirtyFlag)

      expect(isDirty.value).toBe(true)

      unregister()
      expect(isDirty.value).toBe(false)
    })

    it('should return false when isReady is false even if source is dirty', () => {
      const isReady = ref(false)
      const { isDirty, addDirtySource } = useUnsavedChanges({
        isReady,
        enableRouteGuard: false,
        enableBeforeUnload: false
      })
      const dirtyFlag = ref(true)
      addDirtySource(dirtyFlag)

      expect(isDirty.value).toBe(false)
    })

    it('should become true when isReady transitions from false to true', async () => {
      const isReady = ref(false)
      const { isDirty, addDirtySource } = useUnsavedChanges({
        isReady,
        enableRouteGuard: false,
        enableBeforeUnload: false
      })
      const dirtyFlag = ref(true)
      addDirtySource(dirtyFlag)

      expect(isDirty.value).toBe(false)

      isReady.value = true
      await nextTick()

      expect(isDirty.value).toBe(true)
    })

    it('should return false when disabled even if sources are dirty', () => {
      const { isDirty, addDirtySource, disable } = useUnsavedChanges({
        enableRouteGuard: false,
        enableBeforeUnload: false
      })
      const dirtyFlag = ref(true)
      addDirtySource(dirtyFlag)

      disable()

      expect(isDirty.value).toBe(false)
    })

    it('should return true again after re-enabling', () => {
      const { isDirty, addDirtySource, disable, enable } = useUnsavedChanges({
        enableRouteGuard: false,
        enableBeforeUnload: false
      })
      const dirtyFlag = ref(true)
      addDirtySource(dirtyFlag)

      disable()
      expect(isDirty.value).toBe(false)

      enable()
      expect(isDirty.value).toBe(true)
    })
  })

  describe('multiple dirty sources', () => {
    it('should be dirty if any source is dirty', () => {
      const { isDirty, addDirtySource } = useUnsavedChanges({
        enableRouteGuard: false,
        enableBeforeUnload: false
      })
      const sourceA = ref(false)
      const sourceB = ref(true)
      const sourceC = ref(false)

      addDirtySource(sourceA)
      addDirtySource(sourceB)
      addDirtySource(sourceC)

      expect(isDirty.value).toBe(true)
    })

    it('should be clean only when all sources are clean', () => {
      const { isDirty, addDirtySource } = useUnsavedChanges({
        enableRouteGuard: false,
        enableBeforeUnload: false
      })
      const sourceA = ref(false)
      const sourceB = ref(false)
      const sourceC = ref(false)

      addDirtySource(sourceA)
      addDirtySource(sourceB)
      addDirtySource(sourceC)

      expect(isDirty.value).toBe(false)
    })

    it('should become clean when the last dirty source becomes clean', async () => {
      const { isDirty, addDirtySource } = useUnsavedChanges({
        enableRouteGuard: false,
        enableBeforeUnload: false
      })
      const sourceA = ref(true)
      const sourceB = ref(false)

      addDirtySource(sourceA)
      addDirtySource(sourceB)

      expect(isDirty.value).toBe(true)

      sourceA.value = false
      await nextTick()

      expect(isDirty.value).toBe(false)
    })
  })

  describe('guardAction', () => {
    it('should execute action immediately when not dirty', () => {
      const { guardAction } = useUnsavedChanges({
        enableRouteGuard: false,
        enableBeforeUnload: false
      })
      const action = vi.fn()

      guardAction(action)

      expect(action).toHaveBeenCalledOnce()
    })

    it('should show dialog instead of executing action when dirty', () => {
      const { guardAction, addDirtySource, isDialogVisible } = useUnsavedChanges({
        enableRouteGuard: false,
        enableBeforeUnload: false
      })
      const dirtyFlag = ref(true)
      addDirtySource(dirtyFlag)
      const action = vi.fn()

      guardAction(action)

      expect(action).not.toHaveBeenCalled()
      expect(isDialogVisible.value).toBe(true)
    })
  })

  describe('confirmLeave', () => {
    it('should execute the pending action from guardAction', () => {
      const { guardAction, addDirtySource, confirmLeave, isDialogVisible } = useUnsavedChanges({
        enableRouteGuard: false,
        enableBeforeUnload: false
      })
      const dirtyFlag = ref(true)
      addDirtySource(dirtyFlag)
      const action = vi.fn()

      guardAction(action)
      expect(isDialogVisible.value).toBe(true)

      confirmLeave()

      expect(action).toHaveBeenCalledOnce()
      expect(isDialogVisible.value).toBe(false)
    })

    it('should navigate to pending route path when route guard triggered', () => {
      const routeGuardCallback = captureRouteGuard()

      const { addDirtySource, confirmLeave, isDialogVisible } = useUnsavedChanges({
        enableRouteGuard: true,
        enableBeforeUnload: false
      })
      const dirtyFlag = ref(true)
      addDirtySource(dirtyFlag)

      const nextFn = vi.fn()
      routeGuardCallback({ fullPath: '/target-page' }, {}, nextFn)

      expect(isDialogVisible.value).toBe(true)
      expect(nextFn).toHaveBeenCalledWith(false)

      confirmLeave()

      expect(isDialogVisible.value).toBe(false)
      expect(mockRouterPush).toHaveBeenCalledWith('/target-page')
    })
  })

  describe('cancelLeave', () => {
    it('should close dialog without executing action', () => {
      const { guardAction, addDirtySource, cancelLeave, isDialogVisible } = useUnsavedChanges({
        enableRouteGuard: false,
        enableBeforeUnload: false
      })
      const dirtyFlag = ref(true)
      addDirtySource(dirtyFlag)
      const action = vi.fn()

      guardAction(action)
      expect(isDialogVisible.value).toBe(true)

      cancelLeave()

      expect(action).not.toHaveBeenCalled()
      expect(isDialogVisible.value).toBe(false)
    })
  })

  describe('route guard', () => {
    it('should call next() when not dirty', () => {
      const routeGuardCallback = captureRouteGuard()

      useUnsavedChanges({
        enableRouteGuard: true,
        enableBeforeUnload: false
      })

      const nextFn = vi.fn()
      routeGuardCallback({ fullPath: '/other-page' }, {}, nextFn)

      expect(nextFn).toHaveBeenCalledWith()
    })

    it('should call next(false) and show dialog when dirty', () => {
      const routeGuardCallback = captureRouteGuard()

      const { addDirtySource, isDialogVisible } = useUnsavedChanges({
        enableRouteGuard: true,
        enableBeforeUnload: false
      })
      const dirtyFlag = ref(true)
      addDirtySource(dirtyFlag)

      const nextFn = vi.fn()
      routeGuardCallback({ fullPath: '/blocked-page' }, {}, nextFn)

      expect(nextFn).toHaveBeenCalledWith(false)
      expect(isDialogVisible.value).toBe(true)
    })
  })

  describe('isEnabled', () => {
    it('should be true by default', () => {
      const { isEnabled } = useUnsavedChanges({
        enableRouteGuard: false,
        enableBeforeUnload: false
      })

      expect(isEnabled.value).toBe(true)
    })

    it('should be false after calling disable', () => {
      const { isEnabled, disable } = useUnsavedChanges({
        enableRouteGuard: false,
        enableBeforeUnload: false
      })

      disable()

      expect(isEnabled.value).toBe(false)
    })

    it('should be true again after calling enable', () => {
      const { isEnabled, disable, enable } = useUnsavedChanges({
        enableRouteGuard: false,
        enableBeforeUnload: false
      })

      disable()
      enable()

      expect(isEnabled.value).toBe(true)
    })
  })
})

/**
 * Captures the callback registered via onBeforeRouteLeave mock.
 * Must be called before the composable is instantiated.
 */
function captureRouteGuard() {
  let captured = null
  vi.mocked(onBeforeRouteLeave).mockImplementation((callback) => {
    captured = callback
  })
  return (...args) => {
    if (!captured) {
      throw new Error('Route guard callback was not registered. Ensure enableRouteGuard is true.')
    }
    return captured(...args)
  }
}
