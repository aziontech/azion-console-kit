/**
 * Smoke of the functional (browser mode) pipeline — proves the environment is a
 * REAL browser and that a real versioning component renders through the same
 * vite pipeline the app uses. Expanded by spec tasks 4.x (Wave 1).
 */
import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import PrimeVue from 'primevue/config'
import VersionStateBadge from '@/templates/version-shell-block/components/VersionStateBadge.vue'

describe('functional environment (real Chromium)', () => {
  it('has a real focus engine — impossible to fake in jsdom', () => {
    const button = document.createElement('button')
    document.body.appendChild(button)
    button.focus()
    // jsdom no-ops focus(); a real browser moves activeElement.
    expect(document.activeElement).toBe(button)
    button.remove()
  })

  it('renders VersionStateBadge with the real state → label mapping', () => {
    const { getByTestId, rerender } = render(VersionStateBadge, {
      props: { state: 'draft' },
      global: { plugins: [PrimeVue] }
    })
    const badge = getByTestId('version-state-badge')
    expect(badge).toHaveTextContent('Draft')
    expect(badge).toHaveAttribute('data-state', 'draft')

    // Label mapping as declared in VersionStateBadge.vue on THIS branch.
    return rerender({ state: 'active' }).then(() => {
      expect(getByTestId('version-state-badge')).toHaveTextContent('Active')
    })
  })
})
