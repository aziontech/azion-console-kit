/**
 * Functional (real Chromium) — VersionShell in-flight dispatch guard (P0-1).
 *
 * Reproduces and then locks down the double-submit defect: two rapid clicks on
 * a lifecycle button (Save) must dispatch the underlying command only ONCE while
 * the first is still in flight. The whole chain runs for real — the shell, the
 * command bus, the teleported VersionActionBar and a form-adapter-shaped child
 * that registers a SAVE handler on the REAL bus via `onVersionCommand`. The only
 * boundary mocked is `vue-router` (the shell reads route intent + replaces the
 * query), per the versioning testing rule.
 *
 * The SAVE handler returns a caller-controlled pending promise so the "in flight"
 * window is deterministic: nothing resolves until the test resolves/rejects it.
 */
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

// Imported after the router mock so the shell picks up the fake router.
import VersionShell from '@/templates/version-shell-block/index.vue'

const primevue = { plugins: [PrimeVue], directives: { tooltip: Tooltip } }

// Minimal shape `useVersionShell` consumes from the query factory.
const makeVersionQueryFactory =
  (state = 'draft') =>
  () => ({
    data: ref({ id: 'v1', state }),
    isLoading: ref(false),
    isError: ref(false)
  })

// A deferred whose settlement the test controls, so the in-flight window is exact.
const makeDeferred = () => {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

// Child living in the default slot, registering a SAVE handler on the shell's real
// bus — the exact registration path the form adapter uses in production.
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

// The action bar is teleported to #action-bar; query the real <button> from there.
const saveButton = () => document.querySelector('[data-testid="version-action-bar__action-SAVE"]')

const waitForSaveButton = async () => {
  await vi.waitFor(() => expect(saveButton()).not.toBeNull())
  return saveButton()
}

// A real click on the real button element (bypasses actionability so a rapid
// second click can be attempted even after the first flips the disabled flag).
const click = (button) => button.dispatchEvent(new MouseEvent('click', { bubbles: true }))

beforeEach(() => {
  const target = document.createElement('div')
  target.id = 'action-bar'
  document.body.appendChild(target)
})

afterEach(() => {
  document.getElementById('action-bar')?.remove()
})

// Handler factory: each call returns a fresh caller-controlled deferred so the
// test decides exactly when (and how) each in-flight command settles.
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

    // Two rapid clicks before the first command settles.
    click(button)
    click(button)
    await nextTick()

    // The guard swallows the second click while the first is still in flight.
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
    // In flight → visually disabled (feedback), and the handler ran exactly once.
    expect(button).toBeDisabled()
    expect(handler).toHaveBeenCalledTimes(1)

    pending[0].resolve('patched')
    // finally clears the guard → the button becomes usable again.
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

    // A genuine subsequent click dispatches a second time — the guard never sticks.
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

    // Handler REJECTS: the shell swallows it (command-error) and the finally must
    // still clear pendingAction, or the shell would be permanently disabled.
    pending[0].reject(new Error('build failed'))
    await vi.waitFor(() => expect(saveButton()).not.toBeDisabled())

    // Recovery: a new click works after the failed command.
    click(saveButton())
    await nextTick()
    expect(handler).toHaveBeenCalledTimes(2)

    pending[1].resolve('recovered')
  })
})
