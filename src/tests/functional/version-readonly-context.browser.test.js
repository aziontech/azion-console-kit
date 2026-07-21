/**
 * Functional (real Chromium) — readOnly propagation through the version context
 * (spec task 4.4).
 *
 * statusEdgeApp is a real versioning form-field block: it binds its switch to
 * `useVersionContext().readOnly`. Inside the shell (readOnly=true) the switch is a
 * really-disabled control and a real click cannot toggle it; outside the shell
 * (default context) it is enabled and a real click flips its aria-checked state.
 * The context is provided for real via VERSION_CONTEXT_KEY — never mocked.
 */
import { render } from '@testing-library/vue'
import { describe, it, expect } from 'vitest'
import { ref, nextTick } from 'vue'
import PrimeVue from 'primevue/config'
import StatusEdgeApp from '@/views/EdgeApplications/FormFields/block/statusEdgeApp.vue'
import { VERSION_CONTEXT_KEY } from '@/composables/versioning/use-version-context'

// A native click dispatched at the switch's clickable root runs PrimeVue's
// InputSwitch onClick (which flips state only when not disabled) without relying
// on theme CSS for actionability/visibility — the behavior, not the pixels.
const clickSwitch = async (root) => {
  root.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await nextTick()
}

const renderStatus = (readOnly) =>
  render(StatusEdgeApp, {
    global: {
      plugins: [PrimeVue],
      provide: readOnly === undefined ? {} : { [VERSION_CONTEXT_KEY]: { readOnly: ref(readOnly) } }
    }
  })

const getSwitchInput = (container) => container.querySelector('input[role="switch"]')
const getSwitchRoot = (container) =>
  container.querySelector('[data-testid="form-horizontal-active-switch__switch"]')

describe('version-context readOnly (functional)', () => {
  it('readOnly=true: the switch is disabled and a real click cannot toggle it', async () => {
    const { container } = renderStatus(true)
    const input = getSwitchInput(container)
    expect(input).toBeDisabled()

    const before = input.getAttribute('aria-checked')
    // Real click on the switch control: the disabled guard must keep the state.
    await clickSwitch(getSwitchRoot(container))
    expect(input.getAttribute('aria-checked')).toBe(before)
  })

  it('default (outside the shell): the switch is enabled and a real click toggles it', async () => {
    const { container } = renderStatus(undefined)
    const input = getSwitchInput(container)
    expect(input).not.toBeDisabled()

    expect(input.getAttribute('aria-checked')).toBe('false')
    await clickSwitch(getSwitchRoot(container))
    expect(input.getAttribute('aria-checked')).toBe('true')
  })
})
