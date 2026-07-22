/**
 * Coverage-matrix claims (spec versioning-test-coverage / TEST-ARCHITECTURE §3.4).
 * The matrix (tests/coverage-matrix.json) is DERIVED from these markers —
 * run `node scripts/check-coverage-matrix.mjs --write` after changing them.
 * @covers application,custom_page,firewall,workload:J9 component
 */
import { render } from '@testing-library/vue'
import { describe, it, expect } from 'vitest'
import { ref, nextTick } from 'vue'
import PrimeVue from 'primevue/config'
import StatusEdgeApp from '@/views/EdgeApplications/FormFields/block/statusEdgeApp.vue'
import { VERSION_CONTEXT_KEY } from '@/composables/versioning/use-version-context'

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
