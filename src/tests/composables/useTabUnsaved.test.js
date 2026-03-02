import { describe, it, expect, vi } from 'vitest'
import { ref, defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { provideTabUnsaved, useTabUnsaved } from '@/composables/useTabUnsaved'

vi.mock('vue-router', () => ({
  onBeforeRouteLeave: vi.fn(),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    currentRoute: { value: { name: 'test-route' } }
  }))
}))

describe('useTabUnsaved', () => {
  describe('provideTabUnsaved', () => {
    it('should provide the correct context with requestTabChange and unsaved', () => {
      const changeTabFn = vi.fn()
      let context = null

      const TestComponent = defineComponent({
        setup() {
          context = provideTabUnsaved(changeTabFn)
          return () => h('div')
        }
      })

      mount(TestComponent)

      expect(context).not.toBeNull()
      expect(context.requestTabChange).toBeInstanceOf(Function)
      expect(context.unsaved).toBeDefined()
      expect(context.unsaved.isDirty).toBeDefined()
      expect(context.unsaved.isDialogVisible).toBeDefined()
      expect(context.unsaved.addDirtySource).toBeInstanceOf(Function)
      expect(context.unsaved.guardAction).toBeInstanceOf(Function)
      expect(context.unsaved.confirmLeave).toBeInstanceOf(Function)
      expect(context.unsaved.cancelLeave).toBeInstanceOf(Function)
    })
  })

  describe('requestTabChange', () => {
    it('should call changeTabFn immediately when not dirty', () => {
      const changeTabFn = vi.fn()
      let context = null

      const TestComponent = defineComponent({
        setup() {
          context = provideTabUnsaved(changeTabFn)
          return () => h('div')
        }
      })

      mount(TestComponent)

      context.requestTabChange(0, 2)

      expect(changeTabFn).toHaveBeenCalledWith(2)
    })

    it('should show dialog instead of changing tab when dirty', () => {
      const changeTabFn = vi.fn()
      let context = null

      const TestComponent = defineComponent({
        setup() {
          context = provideTabUnsaved(changeTabFn)
          const dirtyFlag = ref(true)
          context.unsaved.addDirtySource(dirtyFlag)
          return () => h('div')
        }
      })

      mount(TestComponent)

      context.requestTabChange(0, 2)

      expect(changeTabFn).not.toHaveBeenCalled()
      expect(context.unsaved.isDialogVisible.value).toBe(true)
    })

    it('should execute tab change after confirmLeave when dirty', () => {
      const changeTabFn = vi.fn()
      let context = null

      const TestComponent = defineComponent({
        setup() {
          context = provideTabUnsaved(changeTabFn)
          const dirtyFlag = ref(true)
          context.unsaved.addDirtySource(dirtyFlag)
          return () => h('div')
        }
      })

      mount(TestComponent)

      context.requestTabChange(0, 3)
      expect(changeTabFn).not.toHaveBeenCalled()

      context.unsaved.confirmLeave()

      expect(changeTabFn).toHaveBeenCalledWith(3)
      expect(context.unsaved.isDialogVisible.value).toBe(false)
    })
  })

  describe('useTabUnsaved (inject)', () => {
    it('should return undefined when no provider exists', () => {
      let injectedContext

      const ChildComponent = defineComponent({
        setup() {
          injectedContext = useTabUnsaved()
          return () => h('div')
        }
      })

      mount(ChildComponent)

      expect(injectedContext).toBeUndefined()
    })

    it('should return the provided context when used inside a provider', () => {
      let injectedContext
      const changeTabFn = vi.fn()

      const ChildComponent = defineComponent({
        setup() {
          injectedContext = useTabUnsaved()
          return () => h('div')
        }
      })

      const ParentComponent = defineComponent({
        setup() {
          provideTabUnsaved(changeTabFn)
          return () => h(ChildComponent)
        }
      })

      mount(ParentComponent)

      expect(injectedContext).toBeDefined()
      expect(injectedContext.requestTabChange).toBeInstanceOf(Function)
      expect(injectedContext.unsaved).toBeDefined()
    })
  })
})
