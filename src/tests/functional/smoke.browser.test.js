import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import PrimeVue from 'primevue/config'
import VersionStateBadge from '@/templates/version-shell-block/components/VersionStateBadge.vue'

describe('functional environment (real Chromium)', () => {
  it('has a real focus engine — impossible to fake in jsdom', () => {
    const button = document.createElement('button')
    document.body.appendChild(button)
    button.focus()
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

    return rerender({ state: 'active' }).then(() => {
      expect(getByTestId('version-state-badge')).toHaveTextContent('Active')
    })
  })
})
