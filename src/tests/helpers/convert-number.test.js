import { describe, it, expect } from 'vitest'
import { formatCurrencyString, formatUnitValue } from '@/helpers/convert-number'

describe('formatCurrencyString', () => {
  it('should format number as currency with all parameters', () => {
    const result = formatCurrencyString('USD', 1234.56, 'en-US')
    expect(result).toEqual('USD 1,234.56')
  })

  it('should format number as currency with default locale', () => {
    const result = formatCurrencyString('USD', 1234.56)
    expect(result).toEqual('USD 1,234.56')
  })

  it('should format number without currency', () => {
    const result = formatCurrencyString(undefined, 1234.56, 'en-US')
    expect(result).toEqual('1,234.56')
  })

  it('should format number with default currency and locale', () => {
    const result = formatCurrencyString(undefined, 1234.56)
    expect(result).toEqual('1,234.56')
  })

  it('should format zero when value is undefined', () => {
    const result = formatCurrencyString('USD')
    expect(result).toEqual('USD 0.00')
  })

  it('should format zero when both value and currency are undefined', () => {
    const result = formatCurrencyString()
    expect(result).toEqual('0')
  })
})

describe('formatUnitValue', () => {
  it('should format number with unit and all parameters', () => {
    const result = formatUnitValue(1234.567, 'kg', 1, 2, 'en-US')
    expect(result).toEqual('1,234.57 kg')
  })

  it('should format number with unit and default fraction digits', () => {
    const result = formatUnitValue(1234.567, 'kg')
    expect(result).toEqual('1,234.567 kg')
  })

  it('should format number without unit', () => {
    const result = formatUnitValue(1234.567)
    expect(result).toEqual('1,234.567')
  })

  it('should format zero when value is undefined', () => {
    const result = formatUnitValue()
    expect(result).toEqual('0')
  })

  it('should format number with unit and specific fraction digits', () => {
    const result = formatUnitValue(1234.567, 'kg', 2, 2)
    expect(result).toEqual('1,234.57 kg')
  })

  it('should format number with unit and locale', () => {
    const result = formatUnitValue(1234.567, 'kg', undefined, undefined, 'de-DE')
    expect(result).toEqual('1.234,567 kg')
  })
})
