import { describe, expect, it } from 'vitest'
import { TIME_INTERVALS } from '@modules/real-time-metrics/constants'

describe('RealTimeMetricsModule', () => {
  describe('Time interval constants', () => {
    it('should be defined', () => {
      expect(TIME_INTERVALS).toBeDefined()
    })

    it('should have the correct key:value pairs', () => {
      const timeIntervals = {
        DATE_TIME_FILTER_INTERVALS: [
          {
            name: 'Last Hour',
            code: '1'
          },
          {
            name: 'Last 24 Hours',
            code: '24'
          },
          {
            name: 'Last 7 Days',
            code: '168'
          },
          {
            name: 'Last 30 Days',
            code: '720'
          },
          {
            name: 'Last 6 Months',
            code: '4320'
          },
          {
            name: 'Custom time range',
            code: 'custom'
          }
        ],
        RESAMPLING_INTERVALS: {
          THREE_DAYS: 259200000,
          SIXTY_DAYS: 5184000000,
          INTERVAL_TO_BE_ADDED: {
            minute: 60000,
            hour: 3600000,
            day: 86400000
          }
        },
        HOUR_IN_MILLISECONDS: 3600000
      }

      expect(TIME_INTERVALS).toEqual(timeIntervals)
    })
  })
})
