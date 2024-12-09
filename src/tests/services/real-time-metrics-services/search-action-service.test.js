import { describe, it, expect } from 'vitest'
import { searchActionService } from '@/services/real-time-metrics-services'

describe('searchActionService', () => {
  it('should return the correct list of actions', () => {
    const expectedActions = [
      { label: 'Allow', value: 'allow' },
      { label: 'Custom HTML', value: 'custom html' },
      { label: 'Deny ', value: 'deny' },
      { label: 'Drop', value: 'drop' },
      { label: 'Hold Connection', value: 'hold connection' },
      { label: 'Random Delay', value: 'random delay' },
      { label: 'Redirect', value: 'redirect' }
    ]

    const result = searchActionService()

    expect(result).toEqual(expectedActions)
    expect(Array.isArray(result)).toBe(true) // Verify it's an array
    expect(result.length).toBe(expectedActions.length) // Verify correct number of actions
  })

  it('should return objects with label and value properties', () => {
    const result = searchActionService()

    result.forEach((action) => {
      expect(action).toHaveProperty('label')
      expect(action).toHaveProperty('value')
    })
  })
})
