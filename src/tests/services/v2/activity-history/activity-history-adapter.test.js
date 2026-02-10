import { describe, expect, it, vi } from 'vitest'

vi.mock('@/helpers/convert-date', () => ({
  formatDateToDayMonthYearHour: vi.fn(() => 'formatted-date')
}))

import { ActivityHistoryAdapter } from '@/services/v2/activity-history/activity-history-adapter'

describe('ActivityHistoryAdapter', () => {
  it('should extract purge items from requestData when resourceType starts with Purge:', () => {
    const event = {
      ts: '2026-02-10T13:30:30Z',
      title: 'Purge:url was created',
      comment: '-',
      type: 'created',
      authorName: 'Paulo Ferreira',
      authorEmail: 'paulo.ferreira@azion.com',
      accountId: '17660',
      resourceId: '-',
      resourceType: 'Purge:url',
      remotePort: '-',
      userId: '23097',
      userIp: '201.149.108.167',
      requestData:
        '{\\"items\\": [\\"itylhbzwpg.map.azionedge.net/image/image.jpeg\\"], \\"layer\\": \\"cache\\"}',
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
      uuid: 'afd7beb8-0e0d-4f8a-961d-50d73bec04c6',
      resourceName: ''
    }

    const result = ActivityHistoryAdapter.transformListActivityHistoryEvents({
      data: { activityHistoryEvents: [event] }
    })

    expect(result).toHaveLength(1)
    expect(result[0].resourceName).toBe('itylhbzwpg.map.azionedge.net/image/image.jpeg')
  })

  it('should keep original resourceName when requestData cannot be parsed', () => {
    const event = {
      ts: '2026-02-10T13:30:30Z',
      title: 'Purge:url was created',
      type: 'created',
      resourceType: 'Purge:url',
      requestData: 'not-json',
      resourceName: 'fallback-name'
    }

    const result = ActivityHistoryAdapter.transformListActivityHistoryEvents({
      data: { activityHistoryEvents: [event] }
    })

    expect(result).toHaveLength(1)
    expect(result[0].resourceName).toBe('fallback-name')
  })
})
