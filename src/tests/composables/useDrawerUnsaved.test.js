import { describe, it, expect, vi } from 'vitest'
import { ref, defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { provideDrawerUnsaved, useDrawerUnsaved } from '@/composables/useDrawerUnsaved'

vi.mock('vue-router', () => ({
  onBeforeRouteLeave: vi.fn(),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    currentRoute: { value: { name: 'test-route' } }
  }))
}))

describe('useDrawerUnsaved', () => {
  describe('provideDrawerUnsaved', () => {
    it('should provide the correct context with requestClose and unsaved', () => {
      const closeFn = vi.fn()
      let context = null

      const TestComponent = defineComponent({
        setup() {
          context = provideDrawerUnsaved(closeFn)
          return () => h('div')
        }
      })

      mount(TestComponent)

      expect(context).not.toBeNull()
      expect(context.requestClose).toBeInstanceOf(Function)
      expect(context.unsaved).toBeDefined()
      expect(context.unsaved.isDirty).toBeDefined()
      expect(context.unsaved.isDialogVisible).toBeDefined()
      expect(context.unsaved.addDirtySource).toBeInstanceOf(Function)
      expect(context.unsaved.guardAction).toBeInstanceOf(Function)
      expect(context.unsaved.confirmLeave).toBeInstanceOf(Function)
      expect(context.unsaved.cancelLeave).toBeInstanceOf(Function)
    })

    it('should pass isReady option to useUnsavedChanges', () => {
      const closeFn = vi.fn()
      const isReady = ref(false)
      let context = null

      const TestComponent = defineComponent({
        setup() {
          context = provideDrawerUnsaved(closeFn, isReady)
          const dirtyFlag = ref(true)
          context.unsaved.addDirtySource(dirtyFlag)
          return () => h('div')
        }
      })

      mount(TestComponent)

      expect(context.unsaved.isDirty.value).toBe(false)

      isReady.value = true
      expect(context.unsaved.isDirty.value).toBe(true)
    })
  })

  describe('requestClose', () => {
    it('should call closeFn immediately when not dirty', () => {
      const closeFn = vi.fn()
      let context = null

      const TestComponent = defineComponent({
        setup() {
          context = provideDrawerUnsaved(closeFn)
          return () => h('div')
        }
      })

      mount(TestComponent)

      context.requestClose()

      expect(closeFn).toHaveBeenCalledOnce()
    })

    it('should show dialog instead of closing when dirty', () => {
      const closeFn = vi.fn()
      let context = null

      const TestComponent = defineComponent({
        setup() {
          context = provideDrawerUnsaved(closeFn)
          const dirtyFlag = ref(true)
          context.unsaved.addDirtySource(dirtyFlag)
          return () => h('div')
        }
      })

      mount(TestComponent)

      context.requestClose()

      expect(closeFn).not.toHaveBeenCalled()
      expect(context.unsaved.isDialogVisible.value).toBe(true)
    })

    it('should execute closeFn after confirmLeave when dirty', () => {
      const closeFn = vi.fn()
      let context = null

      const TestComponent = defineComponent({
        setup() {
          context = provideDrawerUnsaved(closeFn)
          const dirtyFlag = ref(true)
          context.unsaved.addDirtySource(dirtyFlag)
          return () => h('div')
        }
      })

      mount(TestComponent)

      context.requestClose()
      expect(closeFn).not.toHaveBeenCalled()

      context.unsaved.confirmLeave()

      expect(closeFn).toHaveBeenCalledOnce()
      expect(context.unsaved.isDialogVisible.value).toBe(false)
    })

    it('should not execute closeFn after cancelLeave', () => {
      const closeFn = vi.fn()
      let context = null

      const TestComponent = defineComponent({
        setup() {
          context = provideDrawerUnsaved(closeFn)
          const dirtyFlag = ref(true)
          context.unsaved.addDirtySource(dirtyFlag)
          return () => h('div')
        }
      })

      mount(TestComponent)

      context.requestClose()
      expect(context.unsaved.isDialogVisible.value).toBe(true)

      context.unsaved.cancelLeave()

      expect(closeFn).not.toHaveBeenCalled()
      expect(context.unsaved.isDialogVisible.value).toBe(false)
    })
  })

  describe('useDrawerUnsaved (inject)', () => {
    it('should return undefined when no provider exists', () => {
      let injectedContext

      const ChildComponent = defineComponent({
        setup() {
          injectedContext = useDrawerUnsaved()
          return () => h('div')
        }
      })

      mount(ChildComponent)

      expect(injectedContext).toBeUndefined()
    })

    it('should return the provided context when used inside a provider', () => {
      let injectedContext
      const closeFn = vi.fn()

      const ChildComponent = defineComponent({
        setup() {
          injectedContext = useDrawerUnsaved()
          return () => h('div')
        }
      })

      const ParentComponent = defineComponent({
        setup() {
          provideDrawerUnsaved(closeFn)
          return () => h(ChildComponent)
        }
      })

      mount(ParentComponent)

      expect(injectedContext).toBeDefined()
      expect(injectedContext.requestClose).toBeInstanceOf(Function)
      expect(injectedContext.unsaved).toBeDefined()
    })
  })
})
