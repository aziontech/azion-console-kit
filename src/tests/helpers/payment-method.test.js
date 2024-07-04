import { describe, it, expect } from 'vitest'
import { getExpiredDate } from '@/helpers/payment-method'

function getPreviousMonth() {
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  let previousMonth = currentMonth - 1
  let previousYear = currentYear

  if (previousMonth < 0) {
    previousMonth = 11
    previousYear--
  }

  return { month: previousMonth + 1, year: previousYear }
}

function getNextMonth() {
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  let nextMonth = currentMonth + 1
  let nextYear = currentYear

  if (nextMonth > 11) {
    nextMonth = 0
    nextYear++
  }

  return { month: nextMonth + 1, year: nextYear }
}

describe('PaymentMethodHelper', () => {
  it('Check expiration status for a future date', () => {
    const { month, year } = getNextMonth()

    const expectedStatus = ''
    const actualStatus = getExpiredDate(month, year)

    expect(actualStatus).toEqual(expectedStatus)
  })

  it('Check expiration status for a past date', () => {
    const { month, year } = getNextMonth()

    const expectedStatus = 'Expired'
    const actualStatus = getExpiredDate(month, year - 2)

    expect(actualStatus).toEqual(expectedStatus)
  })

  it('Check expiration status for a the current year, but expired', () => {
    const { month, year } = getPreviousMonth()

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
