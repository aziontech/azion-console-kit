import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import { mapVersionStateToStatus, VERSION_STATES } from '@/composables/versioning/version-machine'
import VersionStateBadge from '@/templates/version-shell-block/components/VersionStateBadge.vue'

/**
 * Task 5.5 — the version in use reads as "Current" (Req 4.1, 5.1). Two sources:
 * `active` when the API exposes it, and the host-resolved latest Ready otherwise
 * (frontend heuristic, since the API has no current field for these resources).
 * Active/Inactive stays a SEPARATE enablement tag — never relabelled here.
 */

// Capture the value/severity the PrimeTag receives without rendering the real DS tag.
vi.mock('@aziontech/webkit/prime-tag', () => ({
  default: {
    name: 'PrimeTag',
    props: ['severity', 'value', 'icon', 'rounded'],
    template: '<span :data-severity="severity" :data-value="value" />'
  }
}))

describe('mapVersionStateToStatus — "Current" label', () => {
  it('labels the active version as "Current" (not "Active")', () => {
    expect(mapVersionStateToStatus(VERSION_STATES.ACTIVE)).toEqual({
      content: 'Current',
      severity: 'success'
    })
  })

  it('promotes the latest Ready to "Current" via the isCurrent fallback', () => {
    expect(mapVersionStateToStatus(VERSION_STATES.READY, true)).toEqual({
      content: 'Current',
      severity: 'success'
    })
  })

  it('keeps a plain Ready as "Ready" when it is not the current one', () => {
    expect(mapVersionStateToStatus(VERSION_STATES.READY)).toEqual({
      content: 'Ready',
      severity: 'success'
    })
  })

  it('never promotes a non-built state even when flagged current', () => {
    expect(mapVersionStateToStatus(VERSION_STATES.DRAFT, true)).toEqual({
      content: 'Draft',
      severity: 'info'
    })
  })

  it('fails soft on an unknown state', () => {
    expect(mapVersionStateToStatus('mystery')).toEqual({
      content: 'mystery',
      severity: 'secondary'
    })
  })
})

const labelOf = (wrapper) => wrapper.findComponent({ name: 'PrimeTag' }).props('value')

describe('VersionStateBadge — "Current" rendering', () => {
  it('renders "Current" for an active version', () => {
    const wrapper = mount(VersionStateBadge, { props: { state: VERSION_STATES.ACTIVE } })
    expect(labelOf(wrapper)).toBe('Current')
  })

  it('renders "Current" for the latest Ready when isCurrent is set', () => {
    const wrapper = mount(VersionStateBadge, {
      props: { state: VERSION_STATES.READY, isCurrent: true }
    })
    expect(labelOf(wrapper)).toBe('Current')
  })

  it('renders "Ready" for a non-current built version', () => {
    const wrapper = mount(VersionStateBadge, { props: { state: VERSION_STATES.READY } })
    expect(labelOf(wrapper)).toBe('Ready')
  })

  it('does not promote a draft to Current even when flagged', () => {
    const wrapper = mount(VersionStateBadge, {
      props: { state: VERSION_STATES.DRAFT, isCurrent: true }
    })
    expect(labelOf(wrapper)).toBe('Draft')
  })
})
