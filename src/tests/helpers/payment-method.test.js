import { describe, it, expect } from 'vitest'
import { getExpiredDate } from '@/helpers/payment-method'

describe('PaymentMethodHelper', () => {
  it('Check expiration status for a future date', () => {
    const month = 10
    const year = 2024

    const expectedStatus = ''
    const actualStatus = getExpiredDate(month, year)

    expect(actualStatus).toEqual(expectedStatus)
  })

  it('Check expiration status for a past date', () => {
    const month = 5
    const year = 2021

    const expectedStatus = 'Expired'
    const actualStatus = getExpiredDate(month, year)

    expect(actualStatus).toEqual(expectedStatus)
  })

  it('Check expiration status for the current month and year', () => {
    const currentDate = new Date()
    const month = currentDate.getMonth() + 1
    const year = currentDate.getFullYear()

    const expectedStatus = ''
    const actualStatus = getExpiredDate(month, year)

    expect(actualStatus).toEqual(expectedStatus)
  })
})
