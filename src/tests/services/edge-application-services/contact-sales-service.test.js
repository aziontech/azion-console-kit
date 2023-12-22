import { contactSalesEdgeApplicationService } from '@/services/edge-application-services/contact-sales-service'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('ContactSalesEdgeApplicationService', () => {
  let windowSpy

  beforeEach(() => {
    windowSpy = vi.spyOn(window, 'open').mockImplementation(() => {})
  })

  afterEach(() => {
    windowSpy.mockRestore()
  })

  it('should open a new window with the correct URL', () => {
    contactSalesEdgeApplicationService()

    expect(windowSpy).toHaveBeenCalledWith('https://www.azion.com/en/contact-sales/', '_blank')
  })
})
