import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { onVersionCommand } from '@/composables/versioning/use-version-command'

vi.mock('@aziontech/webkit/progressspinner', () => ({
  default: { name: 'ProgressSpinner', template: '<div data-testid="spinner" />' }
}))

vi.mock('@aziontech/webkit/inlinemessage', () => ({
  default: { name: 'InlineMessage', template: '<div><slot /></div>' }
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ replace: vi.fn() })
}))

import VersionActionBar from '@/templates/version-shell-block/components/VersionActionBar.vue'
import VersionShell from '@/templates/version-shell-block/index.vue'

const makeVersionQueryFactory =
  (state = 'draft') =>
  () => ({
    data: ref({ id: 'v1', state }),
    isLoading: ref(false),
    isError: ref(false)
  })

const makeChildStub = (handler) => ({
  name: 'ChildStub',
  setup() {
    onVersionCommand('SAVE', { execute: handler })
    return () => null
  }
})

const mountShell = ({ handler, state = 'draft' }) =>
  mount(VersionShell, {
    props: {
      useVersionQuery: makeVersionQueryFactory(state),
      resourceId: '1',
      versionId: 'v1'
    },
    slots: {
      default: makeChildStub(handler)
    }
  })

beforeEach(() => {
  const target = document.createElement('div')
  target.id = 'action-bar'
  document.body.appendChild(target)
})

afterEach(() => {
  document.body.innerHTML = ''
})

const saveButton = (wrapper) =>
  wrapper.findComponent(VersionActionBar).get('[data-testid="version-action-bar__action-SAVE"]')

const dispatchSave = (wrapper) => saveButton(wrapper).trigger('click')

describe('VersionShell — handleDispatch events (P3)', () => {
  it('emits `updated` with { action, result } when the handler resolves', async () => {
    const handler = vi.fn().mockResolvedValue('patched')
    const wrapper = mountShell({ handler })
    await flushPromises()

    dispatchSave(wrapper)
    await flushPromises()

    expect(handler).toHaveBeenCalledTimes(1)
    expect(wrapper.emitted('updated')).toEqual([[{ action: 'SAVE', result: 'patched' }]])
    expect(wrapper.emitted('command-error')).toBeUndefined()
  })

  it('emits `command-error` with { action, error } and never rejects when the handler throws', async () => {
    const error = new Error('boom')
    const handler = vi.fn().mockRejectedValue(error)
    const wrapper = mountShell({ handler })
    await flushPromises()

    dispatchSave(wrapper)
    await expect(flushPromises()).resolves.not.toThrow()

    expect(handler).toHaveBeenCalledTimes(1)
    expect(wrapper.emitted('command-error')).toEqual([[{ action: 'SAVE', error }]])
    expect(wrapper.emitted('updated')).toBeUndefined()
  })

  it('passes the handler resolved value through as the `updated` result', async () => {
    const handler = vi.fn().mockResolvedValue({ draftId: 'draft-99' })
    const wrapper = mountShell({ handler })
    await flushPromises()

    dispatchSave(wrapper)
    await flushPromises()

    const updated = wrapper.emitted('updated')
    expect(updated).toHaveLength(1)
    expect(updated[0][0]).toEqual({ action: 'SAVE', result: { draftId: 'draft-99' } })
  })

  it('forwards the action bar `cancel` (navigation intent) without touching the bus', async () => {
    const handler = vi.fn()
    const wrapper = mountShell({ handler })
    await flushPromises()

    wrapper.findComponent(VersionActionBar).vm.$emit('cancel')
    await flushPromises()

    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(handler).not.toHaveBeenCalled()
    expect(wrapper.emitted('updated')).toBeUndefined()
    expect(wrapper.emitted('command-error')).toBeUndefined()
  })

  it('reflects the handler `ready` ref in disabledActions, reactively', async () => {
    const readyRef = ref(false)
    const ChildWithReady = {
      name: 'ChildWithReady',
      setup() {
        onVersionCommand('SAVE', { ready: readyRef, execute: vi.fn() })
        return () => null
      }
    }
    const wrapper = mount(VersionShell, {
      props: {
        useVersionQuery: makeVersionQueryFactory('draft'),
        resourceId: '1',
        versionId: 'v1'
      },
      slots: { default: ChildWithReady }
    })
    await flushPromises()

    expect(saveButton(wrapper).element.disabled).toBe(true)

    readyRef.value = true
    await flushPromises()
    expect(saveButton(wrapper).element.disabled).toBe(false)
  })
})
