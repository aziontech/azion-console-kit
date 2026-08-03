import { render } from '@testing-library/vue'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import PrimeVue from 'primevue/config'
import Tooltip from 'primevue/tooltip'
import { onVersionCommand } from '@/composables/versioning/use-version-command'

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ replace: vi.fn() })
}))

import VersionShell from '@/templates/version-shell-block/index.vue'

const primevue = { plugins: [PrimeVue], directives: { tooltip: Tooltip } }

const makeVersionQueryFactory =
  (state = 'draft') =>
  () => ({
    data: ref({ id: 'v1', state }),
    isLoading: ref(false),
    isError: ref(false)
  })

const makeDeferred = () => {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const makeChild = (handler) => ({
  name: 'SaveAdapterStub',
  setup() {
    onVersionCommand('SAVE', { execute: handler })
    return () => null
  }
})

const mountShell = (handler, state = 'draft') =>
  render(VersionShell, {
    props: {
      useVersionQuery: makeVersionQueryFactory(state),
      resourceId: '1',
      versionId: 'v1'
    },
    slots: { default: makeChild(handler) },
    global: primevue
  })

const saveButton = () => document.querySelector('[data-testid="version-action-bar__action-SAVE"]')

const waitForSaveButton = async () => {
  await vi.waitFor(() => expect(saveButton()).not.toBeNull())
  return saveButton()
}

const click = (button) => button.dispatchEvent(new MouseEvent('click', { bubbles: true }))

beforeEach(() => {
  const target = document.createElement('div')
  target.id = 'action-bar'
  document.body.appendChild(target)
})

afterEach(() => {
  document.getElementById('action-bar')?.remove()
})

const makeControlledHandler = () => {
  const pending = []
  const handler = vi.fn(() => {
    const deferred = makeDeferred()
    pending.push(deferred)
    return deferred.promise
  })
  return { handler, pending }
}

describe('VersionShell — in-flight dispatch guard (double-submit)', () => {
  it('a rapid double-click dispatches SAVE only once while the command is in flight', async () => {
    const { handler, pending } = makeControlledHandler()
    mountShell(handler)
    const button = await waitForSaveButton()

    click(button)
    click(button)
    await nextTick()

    expect(handler).toHaveBeenCalledTimes(1)

    pending[0].resolve('patched')
  })

  it('disables the Save button while the command is in flight, re-enabling once it resolves', async () => {
    const { handler, pending } = makeControlledHandler()
    mountShell(handler)
    const button = await waitForSaveButton()

    expect(button).not.toBeDisabled()

    click(button)
    await nextTick()
    expect(button).toBeDisabled()
    expect(handler).toHaveBeenCalledTimes(1)

    pending[0].resolve('patched')
    await vi.waitFor(() => expect(saveButton()).not.toBeDisabled())
  })

  it('re-enables and dispatches again after the previous command resolves', async () => {
    const { handler, pending } = makeControlledHandler()
    mountShell(handler)
    const button = await waitForSaveButton()

    click(button)
    await nextTick()
    expect(handler).toHaveBeenCalledTimes(1)

    pending[0].resolve('patched')
    await vi.waitFor(() => expect(saveButton()).not.toBeDisabled())

    click(saveButton())
    await nextTick()
    expect(handler).toHaveBeenCalledTimes(2)

    pending[1].resolve('patched-again')
  })

  it('clears the guard in finally when the command rejects, so the shell never locks', async () => {
    const { handler, pending } = makeControlledHandler()
    mountShell(handler)
    const button = await waitForSaveButton()

    click(button)
    await nextTick()
    expect(button).toBeDisabled()
    expect(handler).toHaveBeenCalledTimes(1)

    pending[0].reject(new Error('build failed'))
    await vi.waitFor(() => expect(saveButton()).not.toBeDisabled())

    click(saveButton())
    await nextTick()
    expect(handler).toHaveBeenCalledTimes(2)

    pending[1].resolve('recovered')
  })
})
