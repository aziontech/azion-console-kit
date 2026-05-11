import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.mock is hoisted to the top of the file, so any variables used inside
// the factory must also be hoisted via vi.hoisted().
const { mockDecoratorRequest, MockDecoratorClass } = vi.hoisted(() => {
  const mockDecoratorRequest = vi.fn()
  const MockDecoratorClass = vi.fn().mockImplementation(() => ({
    request: mockDecoratorRequest
  }))
  return { mockDecoratorRequest, MockDecoratorClass }
})

// Mock AxiosHttpClientSignalDecorator completely.
// The constructor spy lets us assert which signal was passed.
// The instance exposes `request` so the service can call it.
vi.mock('@/services/axios/AxiosHttpClientSignalDecorator', () => ({
  AxiosHttpClientSignalDecorator: MockDecoratorClass
}))

vi.mock('@/services/real-time-events-service/make-real-time-events-service', () => ({
  makeRealTimeEventsBaseUrl: () => 'v4/events/graphql'
}))

const { loadSummaryKpis } = await import('../load-events-aggregation')

const VALID_TS_RANGE = {
  tsRangeBegin: '2024-01-01T00:00:00Z',
  tsRangeEnd: '2024-01-01T01:00:00Z'
}

beforeEach(() => {
  // Reset call history but restore the MockDecoratorClass implementation,
  // since vi.clearAllMocks() would wipe the mockImplementation set via vi.hoisted().
  mockDecoratorRequest.mockReset()
  MockDecoratorClass.mockClear()
  MockDecoratorClass.mockImplementation(() => ({ request: mockDecoratorRequest }))
})

describe('loadSummaryKpis', () => {
  describe('returns null for non-HTTP-like datasets', () => {
    it('returns null for functionEvents without making any HTTP call', async () => {
      const result = await loadSummaryKpis({
        dataset: 'functionEvents',
        tsRange: VALID_TS_RANGE
      })

      expect(result).toBeNull()
      expect(mockDecoratorRequest).not.toHaveBeenCalled()
    })

    it('returns null for edgeDnsQueriesEvents without making any HTTP call', async () => {
      const result = await loadSummaryKpis({
        dataset: 'edgeDnsQueriesEvents',
        tsRange: VALID_TS_RANGE
      })

      expect(result).toBeNull()
      expect(mockDecoratorRequest).not.toHaveBeenCalled()
    })
  })

  describe('returns null when tsRange is missing or incomplete', () => {
    it('returns null when tsRange is an empty object', async () => {
      const result = await loadSummaryKpis({
        dataset: 'workloadEvents',
        tsRange: {}
      })

      expect(result).toBeNull()
      expect(mockDecoratorRequest).not.toHaveBeenCalled()
    })

    it('returns null when tsRangeBegin is missing', async () => {
      const result = await loadSummaryKpis({
        dataset: 'workloadEvents',
        tsRange: { tsRangeEnd: '2024-01-01T01:00:00Z' }
      })

      expect(result).toBeNull()
      expect(mockDecoratorRequest).not.toHaveBeenCalled()
    })

    it('returns null when tsRangeEnd is missing', async () => {
      const result = await loadSummaryKpis({
        dataset: 'workloadEvents',
        tsRange: { tsRangeBegin: '2024-01-01T00:00:00Z' }
      })

      expect(result).toBeNull()
      expect(mockDecoratorRequest).not.toHaveBeenCalled()
    })
  })

  describe('returns the expected KPI shape on success', () => {
    it('computes total, clientErrors, serverErrors, avgRequestTime and support flags', async () => {
      mockDecoratorRequest.mockResolvedValue({
        statusCode: 200,
        body: {
          data: {
            kpiByStatus: [
              { status: '200', count: 100 },
              { status: '404', count: 10 },
              { status: '500', count: 5 }
            ],
            kpiAvgRt: [{ avg: 0.123 }]
          }
        }
      })

      const result = await loadSummaryKpis({
        dataset: 'workloadEvents',
        tsRange: VALID_TS_RANGE
      })

      expect(result).toEqual({
        total: 115,
        clientErrors: 10,
        serverErrors: 5,
        avgRequestTime: 0.123,
        supportsStatusBreakdown: true,
        supportsRequestTime: true
      })
    })

    it('counts all 4xx codes as clientErrors and all 5xx codes as serverErrors', async () => {
      mockDecoratorRequest.mockResolvedValue({
        statusCode: 200,
        body: {
          data: {
            kpiByStatus: [
              { status: '200', count: 50 },
              { status: '301', count: 5 },
              { status: '400', count: 3 },
              { status: '403', count: 4 },
              { status: '404', count: 3 },
              { status: '500', count: 2 },
              { status: '503', count: 1 }
            ],
            kpiAvgRt: [{ avg: 0.05 }]
          }
        }
      })

      const result = await loadSummaryKpis({
        dataset: 'workloadEvents',
        tsRange: VALID_TS_RANGE
      })

      expect(result.total).toBe(68)
      expect(result.clientErrors).toBe(10)
      expect(result.serverErrors).toBe(3)
      expect(result.supportsStatusBreakdown).toBe(true)
    })

    it('sets supportsRequestTime to false when kpiAvgRt is empty', async () => {
      mockDecoratorRequest.mockResolvedValue({
        statusCode: 200,
        body: {
          data: {
            kpiByStatus: [{ status: '200', count: 20 }],
            kpiAvgRt: []
          }
        }
      })

      const result = await loadSummaryKpis({
        dataset: 'workloadEvents',
        tsRange: VALID_TS_RANGE
      })

      expect(result.avgRequestTime).toBeNull()
      expect(result.supportsRequestTime).toBe(false)
    })
  })

  describe('forwards signal to AxiosHttpClientSignalDecorator', () => {
    it('constructs AxiosHttpClientSignalDecorator with the provided signal', async () => {
      mockDecoratorRequest.mockResolvedValue({
        statusCode: 200,
        body: {
          data: {
            kpiByStatus: [{ status: '200', count: 1 }],
            kpiAvgRt: [{ avg: 0.01 }]
          }
        }
      })

      const controller = new AbortController()
      const { signal } = controller

      await loadSummaryKpis({
        dataset: 'workloadEvents',
        tsRange: VALID_TS_RANGE,
        signal
      })

      expect(MockDecoratorClass).toHaveBeenCalledWith(signal)
    })

    it('constructs AxiosHttpClientSignalDecorator with undefined when no signal is provided', async () => {
      mockDecoratorRequest.mockResolvedValue({
        statusCode: 200,
        body: {
          data: {
            kpiByStatus: [{ status: '200', count: 1 }],
            kpiAvgRt: [{ avg: 0.01 }]
          }
        }
      })

      await loadSummaryKpis({
        dataset: 'workloadEvents',
        tsRange: VALID_TS_RANGE
      })

      expect(MockDecoratorClass).toHaveBeenCalledWith(undefined)
    })
  })

  describe('throws on non-200 HTTP response', () => {
    it('throws with body.detail when the HTTP response status is 500', async () => {
      mockDecoratorRequest.mockResolvedValue({
        statusCode: 500,
        body: { detail: 'Internal Server Error' }
      })

      await expect(
        loadSummaryKpis({ dataset: 'workloadEvents', tsRange: VALID_TS_RANGE })
      ).rejects.toThrow('Internal Server Error')
    })

    it('throws with a fallback message when body.detail is absent', async () => {
      mockDecoratorRequest.mockResolvedValue({
        statusCode: 503,
        body: {}
      })

      await expect(
        loadSummaryKpis({ dataset: 'workloadEvents', tsRange: VALID_TS_RANGE })
      ).rejects.toThrow('KPI API error')
    })

    it('throws with body.detail when the HTTP response status is 400', async () => {
      mockDecoratorRequest.mockResolvedValue({
        statusCode: 400,
        body: { detail: 'Bad Request' }
      })

      await expect(
        loadSummaryKpis({ dataset: 'workloadEvents', tsRange: VALID_TS_RANGE })
      ).rejects.toThrow('Bad Request')
    })
  })
})
