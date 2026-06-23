import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { onVersionCommand } from '@/composables/versioning/use-version-command'

// Webkit primitives the shell imports — stub to plain DOM so jsdom is happy.
vi.mock('@aziontech/webkit/progressspinner', () => ({
  default: { name: 'ProgressSpinner', template: '<div data-testid="spinner" />' }
}))

vi.mock('@aziontech/webkit/inlinemessage', () => ({
  default: { name: 'InlineMessage', template: '<div><slot /></div>' }
}))

// Stub the children: ProcessingOverlay is irrelevant here (state is `draft`),
// and VersionActionBar is replaced by a minimal stub that re-emits `dispatch`,
// which is the real integration seam into `handleDispatch`.
vi.mock('@/templates/version-shell-block/components/ProcessingOverlay.vue', () => ({
  default: { name: 'ProcessingOverlay', template: '<div data-testid="overlay" />' }
}))

// `vi.hoisted` so the stub is initialized before the hoisted `vi.mock` factory
// reads it — referencing a plain top-level const there hits the TDZ.
const { VersionActionBarStub } = vi.hoisted(() => ({
  VersionActionBarStub: {
    name: 'VersionActionBar',
    props: ['state', 'availableActions', 'disabledActions'],
    emits: ['dispatch', 'cancel'],
    template: '<div data-testid="action-bar" />'
  }
}))

vi.mock('@/templates/version-shell-block/components/VersionActionBar.vue', () => ({
  default: VersionActionBarStub
}))

import VersionShell from '@/templates/version-shell-block/index.vue'

// Minimal shape `useVersionShell` consumes: data.value, isLoading, isError.
const makeVersionQueryFactory =
  (state = 'draft') =>
  () => ({
    data: ref({ id: 'v1', state }),
    isLoading: ref(false),
    isError: ref(false)
  })

// Child that lives in the default slot and registers a SAVE handler on the
// bus provided by the shell — the real registration path used in production.
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

// The shell teleports its action bar to #action-bar (a host layout target); create
// it so the teleport is valid and findComponent can reach the (teleported) stub.
beforeEach(() => {
  const target = document.createElement('div')
  target.id = 'action-bar'
  document.body.appendChild(target)
})

afterEach(() => {
  document.body.innerHTML = ''
})

const dispatchSave = (wrapper) =>
  wrapper.findComponent(VersionActionBarStub).vm.$emit('dispatch', 'SAVE', {})

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
    // P3 invariant: handleDispatch's try/catch swallows the handler rejection,
    // so this flush settles cleanly. A leaked rejection would reject here and
    // fail the test.
    await expect(flushPromises()).resolves.not.toThrow()

    expect(handler).toHaveBeenCalledTimes(1)
    expect(wrapper.emitted('command-error')).toEqual([[{ action: 'SAVE', error }]])
    // Failure path does NOT surface as `updated`.
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

    wrapper.findComponent(VersionActionBarStub).vm.$emit('cancel')
    await flushPromises()

    expect(wrapper.emitted('cancel')).toHaveLength(1)
    // Cancel is pure navigation: no command handler runs, no command events fire.
    expect(handler).not.toHaveBeenCalled()
    expect(wrapper.emitted('updated')).toBeUndefined()
    expect(wrapper.emitted('command-error')).toBeUndefined()
  })

  // Regression: the bus must preserve the `ready` ref when iterated by the shell.
  // With ref()/readonly() (deep reactive), the proxy unwrapped the ref on access
  // (`entry.ready` became a boolean) and `!entry.ready.value` evaluated `!undefined`,
  // disabling SAVE exactly when the form was VALID.
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

    const actionBar = wrapper.findComponent(VersionActionBarStub)
    // ready=false → SAVE disabled.
    expect(actionBar.props('disabledActions')).toContain('SAVE')

    // ready=true → recomputes and enables.
    readyRef.value = true
    await flushPromises()
    expect(actionBar.props('disabledActions')).not.toContain('SAVE')
  })
})
