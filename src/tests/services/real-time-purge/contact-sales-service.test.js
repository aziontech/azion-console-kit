import { contactSalesRealTimePurgeService } from '@/services/real-time-purge/contact-sales-service'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('ContactSalesRealTimePurgeService', () => {
  let windowSpy

  beforeEach(() => {
    windowSpy = vi.spyOn(window, 'open').mockImplementation(() => {})
  })

  afterEach(() => {
    windowSpy.mockRestore()
  })

  it('should open a new window with the correct URL', () => {
    contactSalesRealTimePurgeService()

    expect(windowSpy).toHaveBeenCalledWith('https://www.azion.com/en/contact-sales/', '_blank')
  })
})
