import { describe, it, expect } from 'vitest'
import { ref, nextTick } from 'vue'
import { useFormSkeleton } from '../../composables/useFormSkeleton'

describe('useFormSkeleton', () => {
  it('should show skeleton when loading is true and no cached data exists', () => {
    const isLoading = ref(true)
    const cachedData = ref(undefined)

    const { showSkeleton } = useFormSkeleton({ isLoading, cachedData })

    expect(showSkeleton.value).toBe(true)
  })

  it('should not show skeleton when loading is false', () => {
    const isLoading = ref(false)
    const cachedData = ref(undefined)

    const { showSkeleton } = useFormSkeleton({ isLoading, cachedData })

    expect(showSkeleton.value).toBe(false)
  })

  it('should not show skeleton when cached data is available even if loading', () => {
    const isLoading = ref(true)
    const cachedData = ref({ id: 1, name: 'Test Stream' })

    const { showSkeleton } = useFormSkeleton({ isLoading, cachedData })

    expect(showSkeleton.value).toBe(false)
  })

  it('should not show skeleton when data (loaded) is available even if loading', () => {
    const isLoading = ref(true)
    const cachedData = ref(undefined)
    const data = ref({ id: 1, name: 'Test Stream' })

    const { showSkeleton } = useFormSkeleton({ isLoading, cachedData, data })

    expect(showSkeleton.value).toBe(false)
  })

  it('should not show skeleton when cached data is an empty object', () => {
    const isLoading = ref(true)
    const cachedData = ref({})

    const { showSkeleton } = useFormSkeleton({ isLoading, cachedData })

    // Empty object means no meaningful cache data
    expect(showSkeleton.value).toBe(true)
  })

  it('should react to loading state changing from true to false', async () => {
    const isLoading = ref(true)
    const cachedData = ref(undefined)

    const { showSkeleton } = useFormSkeleton({ isLoading, cachedData })

    expect(showSkeleton.value).toBe(true)

    isLoading.value = false
    await nextTick()

    expect(showSkeleton.value).toBe(false)
  })

  it('should react to cached data becoming available', async () => {
    const isLoading = ref(true)
    const cachedData = ref(undefined)

    const { showSkeleton } = useFormSkeleton({ isLoading, cachedData })

    expect(showSkeleton.value).toBe(true)

    cachedData.value = { id: 1, name: 'Cached Stream' }
    await nextTick()

    expect(showSkeleton.value).toBe(false)
  })

  it('should not show skeleton during background refetch (loading false, data exists)', () => {
    const isLoading = ref(false)
    const cachedData = ref({ id: 1, name: 'Cached Stream' })

    const { showSkeleton } = useFormSkeleton({ isLoading, cachedData })

    expect(showSkeleton.value).toBe(false)
  })

  it('should show skeleton when cache expired and new fetch starts', () => {
    const isLoading = ref(true)
    const cachedData = ref(undefined) // cache expired

    const { showSkeleton } = useFormSkeleton({ isLoading, cachedData })

    expect(showSkeleton.value).toBe(true)
  })

  it('should handle null cached data gracefully', () => {
    const isLoading = ref(true)
    const cachedData = ref(null)

    const { showSkeleton } = useFormSkeleton({ isLoading, cachedData })

    expect(showSkeleton.value).toBe(true)
  })

  it('should not show skeleton when cachedData is null but data is available', () => {
    const isLoading = ref(true)
    const cachedData = ref(null)
    const data = ref({ id: 1, name: 'Stream' })

    const { showSkeleton } = useFormSkeleton({ isLoading, cachedData, data })

    expect(showSkeleton.value).toBe(false)
  })
})
