import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { PrefetchScheduler } from '@services/v2/base/cache-sync/prefetch-scheduler'

describe('PrefetchScheduler', () => {
  let mockExecutor
  let scheduler

  beforeEach(() => {
    vi.useFakeTimers()
    mockExecutor = {
      execute: vi.fn().mockResolvedValue(undefined)
    }
    scheduler = new PrefetchScheduler({ executor: mockExecutor })
  })

  afterEach(() => {
    scheduler.destroy()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('schedule()', () => {
    it('should add keys to pending set', () => {
      scheduler.schedule([['application', 'all']])

      expect(scheduler.pendingCount).toBe(1)
    })

    it('should deduplicate identical keys', () => {
      scheduler.schedule([['application', 'all']])
      scheduler.schedule([['application', 'all']])

      expect(scheduler.pendingCount).toBe(1)
    })

    it('should handle multiple unique keys', () => {
      scheduler.schedule([['application', 'all']])
      scheduler.schedule([['application', 'detail', '123']])

      expect(scheduler.pendingCount).toBe(2)
    })

    it('should start timer on first schedule', () => {
      scheduler.schedule([['application', 'all']])

      expect(scheduler.isTimerActive).toBe(true)
    })

    it('should not reset timer on subsequent schedule (fixed window from first event)', () => {
      scheduler.schedule([['application', 'all']])
      vi.advanceTimersByTime(8000)

      scheduler.schedule([['application', 'detail', '123']])

      // Timer should still be active and unchanged
      expect(scheduler.isTimerActive).toBe(true)

      // Original 10s should trigger execution (timer not reset)
      vi.advanceTimersByTime(2000)
      expect(mockExecutor.execute).toHaveBeenCalled()
    })

    it('should handle empty array', () => {
      scheduler.schedule([])

      expect(scheduler.pendingCount).toBe(0)
      expect(scheduler.isTimerActive).toBe(false)
    })

    it('should handle null/undefined', () => {
      scheduler.schedule(null)
      scheduler.schedule(undefined)

      expect(scheduler.pendingCount).toBe(0)
      expect(scheduler.isTimerActive).toBe(false)
    })

    it('should not schedule after destroy', () => {
      scheduler.destroy()
      scheduler.schedule([['application', 'all']])

      expect(scheduler.isTimerActive).toBe(false)
    })
  })

  describe('timer behavior', () => {
    it('should fire executor after debounce window', async () => {
      scheduler.schedule([['application', 'all']])

      vi.advanceTimersByTime(10000)

      expect(mockExecutor.execute).toHaveBeenCalledTimes(1)
      expect(mockExecutor.execute).toHaveBeenCalledWith([['application', 'all']])
    })

    it('should aggregate multiple schedule calls into single execution', () => {
      scheduler.schedule([['key1']])
      scheduler.schedule([['key2', 'nested']])
      scheduler.schedule([['key1']]) // duplicate

      vi.advanceTimersByTime(10000)

      expect(mockExecutor.execute).toHaveBeenCalledTimes(1)
      const calledKeys = mockExecutor.execute.mock.calls[0][0]
      expect(calledKeys).toHaveLength(2)
    })

    it('should clear pending keys after timer fires', () => {
      scheduler.schedule([['application', 'all']])

      vi.advanceTimersByTime(10000)

      expect(scheduler.pendingCount).toBe(0)
      expect(scheduler.isTimerActive).toBe(false)
    })

    it('should handle executor errors gracefully', async () => {
      mockExecutor.execute.mockRejectedValueOnce(new Error('Executor failed'))

      scheduler.schedule([['application', 'all']])

      // Should not throw
      vi.advanceTimersByTime(10000)

      expect(mockExecutor.execute).toHaveBeenCalled()
    })
  })

  describe('flush()', () => {
    it('should execute immediately without waiting for timer', () => {
      scheduler.schedule([['application', 'all']])

      expect(scheduler.isTimerActive).toBe(true)

      scheduler.flush()

      expect(mockExecutor.execute).toHaveBeenCalled()
      expect(scheduler.pendingCount).toBe(0)
      expect(scheduler.isTimerActive).toBe(false)
    })

    it('should clear timer when flushing', () => {
      scheduler.schedule([['application', 'all']])
      vi.advanceTimersByTime(5000)

      scheduler.flush()

      // Timer should be cleared, advancing time should not cause another execution
      vi.advanceTimersByTime(10000)
      expect(mockExecutor.execute).toHaveBeenCalledTimes(1)
    })

    it('should handle flush with no pending keys', () => {
      scheduler.flush()

      expect(mockExecutor.execute).not.toHaveBeenCalled()
    })
  })

  describe('destroy()', () => {
    it('should clear timer and pending keys', () => {
      scheduler.schedule([['application', 'all']])

      scheduler.destroy()

      expect(scheduler.pendingCount).toBe(0)
      expect(scheduler.isTimerActive).toBe(false)
    })

    it('should be idempotent', () => {
      scheduler.destroy()
      scheduler.destroy()

      // Should not throw
      expect(true).toBe(true)
    })

    it('should prevent further scheduling', () => {
      scheduler.destroy()

      scheduler.schedule([['application', 'all']])

      expect(scheduler.pendingCount).toBe(0)
    })
  })

  describe('custom debounce time', () => {
    it('should use custom debounce time', () => {
      const customScheduler = new PrefetchScheduler({
        executor: mockExecutor,
        debounceMs: 5000
      })

      customScheduler.schedule([['application', 'all']])

      vi.advanceTimersByTime(5000)

      expect(mockExecutor.execute).toHaveBeenCalled()

      customScheduler.destroy()
    })
  })
})
