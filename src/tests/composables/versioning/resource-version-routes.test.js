import { describe, it, expect } from 'vitest'
import { RESOURCE_VERSION_ROUTES } from '@/composables/versioning/use-version-menu-actions'

/**
 * Regression guard: every versioned resourceType must have a version-editor route
 * in RESOURCE_VERSION_ROUTES, or row-menu "Open configuration" (and the row click,
 * which routes through OPEN_CONFIGURATION) silently no-ops — the bug that left
 * network_list/waf unable to open their version editor.
 */
const VERSIONED_RESOURCE_TYPES = [
  'application',
  'firewall',
  'custom_page',
  'function',
  'connector',
  'workload',
  'network_list',
  'waf'
]

describe('RESOURCE_VERSION_ROUTES — version-editor route map', () => {
  it.each(VERSIONED_RESOURCE_TYPES)('maps "%s" to a non-empty route name', (type) => {
    expect(RESOURCE_VERSION_ROUTES[type]).toBeTruthy()
    expect(typeof RESOURCE_VERSION_ROUTES[type]).toBe('string')
  })

  it('registers the versioned-only sub-resources network_list and waf', () => {
    expect(RESOURCE_VERSION_ROUTES.network_list).toBe('edit-network-lists-version')
    expect(RESOURCE_VERSION_ROUTES.waf).toBe('edit-waf-rules-version')
  })
})
