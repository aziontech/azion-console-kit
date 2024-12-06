import { describe, it, expect } from 'vitest'
import { searchClassifiedService } from '@/services/real-time-metrics-services'

describe('searchClassifiedService', () => {
  it('should return the correct list of classifications', () => {
    const expectedClassifications = [
      { label: 'Legitimate', value: 'legitimate' },
      { label: 'Good Bot', value: 'good bot' },
      { label: 'Bad Bot ', value: 'bad bot' },
      { label: 'Under Evaluation', value: 'under evaluation' }
    ]

    const result = searchClassifiedService()

    expect(result).toEqual(expectedClassifications)
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBe(expectedClassifications.length)
  })

  it('should return objects with label and value properties', () => {
    const result = searchClassifiedService()

    result.forEach((classification) => {
      expect(classification).toHaveProperty('label')
      expect(classification).toHaveProperty('value')
    })
  })
})
