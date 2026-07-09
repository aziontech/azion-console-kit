import { describe, expect, it } from 'vitest'
import { resourceBuildRoute } from '@/templates/release-composition/resource-build-route'

describe('resourceBuildRoute', () => {
  it.each([
    ['application', 'edit-application'],
    ['firewall', 'edit-firewall'],
    ['custom_page', 'edit-custom-pages'],
    ['function', 'edit-functions'],
    ['connector', 'edit-connectors'],
    ['network_list', 'edit-network-lists'],
    ['waf', 'edit-waf-rules']
  ])('maps %s to its edit route with the resource id', (type, name) => {
    expect(resourceBuildRoute({ type, resourceId: 42 })).toEqual({
      name,
      params: { id: '42' }
    })
  })

  it('coerces the resource id to a string', () => {
    expect(resourceBuildRoute({ type: 'function', resourceId: 7 }).params.id).toBe('7')
  })

  it('returns null for an unknown resource type', () => {
    expect(resourceBuildRoute({ type: 'unknown', resourceId: 1 })).toBeNull()
  })

  it('returns null when the resource id is missing', () => {
    expect(resourceBuildRoute({ type: 'function' })).toBeNull()
    expect(resourceBuildRoute({ type: 'function', resourceId: null })).toBeNull()
    expect(resourceBuildRoute({ type: 'function', resourceId: '' })).toBeNull()
  })

  it('returns null when called with no arguments', () => {
    expect(resourceBuildRoute()).toBeNull()
  })
})
