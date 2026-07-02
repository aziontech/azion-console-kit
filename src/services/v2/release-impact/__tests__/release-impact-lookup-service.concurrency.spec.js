import { describe, it, expect } from 'vitest'
import { createReleaseImpactLookupService } from '@/services/v2/release-impact/release-impact-lookup-service'

const FIRST_PAGE_SIZE = 100
const TOTAL_COUNT = 1000
const TOTAL_PAGES = TOTAL_COUNT / FIRST_PAGE_SIZE
const FANOUT_PAGES = TOTAL_PAGES - 1

const firstPageBody = () =>
  Array.from({ length: FIRST_PAGE_SIZE }, (unused, position) => ({
    id: position,
    active: { content: 'Active' },
    bindings:
      position === 0
        ? [{ deployment_id: 'dep-1', environment_id: 'env-1', domains: ['a.example.com'] }]
        : []
  }))

// vue-query's suspense() resolves to the QueryObserverResult, so the service
// payload ({ body, count }) is nested under `.data` — mirror that here.
const workloadsFirstPageQuery = () => ({
  suspense: async () => ({ data: { body: firstPageBody(), count: TOTAL_COUNT } })
})

const emptyEnvironmentsQuery = () => ({
  suspense: async () => ({ data: { body: [], count: 0 } })
})

describe('releaseImpactLookupService.getReverseLookup — fan-out concurrency (Property 3)', () => {
  it('never holds more than MAX_CONCURRENT_FANOUT (3) listWorkloads in flight', async () => {
    let inFlight = 0
    let maxInFlight = 0
    const pagesSeen = []

    const listWorkloads = async ({ page }) => {
      pagesSeen.push(page)
      inFlight += 1
      maxInFlight = Math.max(maxInFlight, inFlight)
      await new Promise((resolve) => setTimeout(resolve, 5))
      inFlight -= 1
      return { body: [], count: TOTAL_COUNT }
    }

    const service = createReleaseImpactLookupService({
      workloadService: {
        useWorkloadsListQuery: workloadsFirstPageQuery,
        listWorkloads
      },
      environmentService: { useEnvironmentsListQuery: emptyEnvironmentsQuery }
    })

    const result = await service.getReverseLookup({})

    expect(pagesSeen).toHaveLength(FANOUT_PAGES)
    expect(maxInFlight).toBeGreaterThan(1)
    expect(maxInFlight).toBeLessThanOrEqual(3)
    // Regression guard: the first-page payload must be read from `.data.body`,
    // so the active workload's binding lands in the index (not an empty index).
    expect(result.index['dep-1']).toHaveLength(1)
  })

  it('resolves as partial (not throws) when one fan-out page rejects, still processing the rest', async () => {
    const failingPage = 3
    const processedPages = []

    const listWorkloads = async ({ page }) => {
      await new Promise((resolve) => setTimeout(resolve, 5))
      if (page === failingPage) {
        throw new Error(`page ${page} blew up`)
      }
      processedPages.push(page)
      return { body: [], count: TOTAL_COUNT }
    }

    const service = createReleaseImpactLookupService({
      workloadService: {
        useWorkloadsListQuery: workloadsFirstPageQuery,
        listWorkloads
      },
      environmentService: { useEnvironmentsListQuery: emptyEnvironmentsQuery }
    })

    const result = await service.getReverseLookup({})

    expect(result.isPartial).toBe(true)
    expect(processedPages).toHaveLength(FANOUT_PAGES - 1)
    expect(processedPages).not.toContain(failingPage)
    expect(processedPages).toContain(2)
    expect(processedPages).toContain(TOTAL_PAGES)
  })
})
