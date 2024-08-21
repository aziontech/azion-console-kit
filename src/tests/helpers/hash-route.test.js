import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useRouteFilterManager } from '@/helpers/hash-route'
import { useRoute, useRouter } from 'vue-router'

vi.mock('vue-router', () => ({
  useRoute: vi.fn(),
  useRouter: vi.fn()
}))

describe('useRouteFilterManager', () => {
  const mockRoute = {
    query: {}
  }
  const mockRouter = {
    push: vi.fn()
  }

  beforeEach(() => {
    useRoute.mockReturnValue(mockRoute)
    useRouter.mockReturnValue(mockRouter)
  })

  it('should encode a filter object to a base64 string', () => {
    const { encodeFilter } = useRouteFilterManager()
    const filter = { key: 'value' }
    const encoded = encodeFilter(filter)
    expect(encoded).toBe(btoa(JSON.stringify(filter)))
  })

  it('should decode a base64 string to a filter object', () => {
    const { decodeFilter } = useRouteFilterManager()
    const filter = { key: 'value' }
    const encoded = btoa(JSON.stringify(filter))
    const decoded = decodeFilter(encoded)
    expect(decoded).toEqual(filter)
  })

  it('should retrieve and decode the filter object from the URL hash', () => {
    const { getFiltersFromHash } = useRouteFilterManager()
    const filter = { key: 'value' }
    mockRoute.query.filters = btoa(JSON.stringify(filter))
    const result = getFiltersFromHash()
    expect(result).toEqual(filter)
  })

  it('should return null if no filter is set in the URL hash', () => {
    const { getFiltersFromHash } = useRouteFilterManager()
    mockRoute.query.filters = null
    const result = getFiltersFromHash()
    expect(result).toBeNull()
  })

  it('should encode the filter object and update the URL hash', () => {
    const { setFilterInHash } = useRouteFilterManager()
    const filter = { key: 'value' }
    setFilterInHash(filter)
    expect(mockRouter.push).toHaveBeenCalledWith({
      ...mockRoute,
      query: { ...mockRoute.query, filters: btoa(JSON.stringify(filter)) }
    })
  })

  it('should remove the filter object from the URL hash', () => {
    const { removeFiltersFromHash } = useRouteFilterManager()
    mockRoute.query.filters = btoa(JSON.stringify({ key: 'value' }))
    removeFiltersFromHash()
    expect(mockRouter.push).toHaveBeenCalledWith({
      ...mockRoute,
      query: {}
    })
  })
})
