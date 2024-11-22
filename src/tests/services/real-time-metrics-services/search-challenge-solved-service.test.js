import { describe, it, expect } from 'vitest'
import { searchChallengeSolvedService } from '@/services/real-time-metrics-services'

describe('searchChallengeSolvedService', () => {
  it('should return the correct list of challenge solutions', () => {
    const expectedSolutions = [
      { label: 'Solved', value: true },
      { label: 'Not Solved', value: false }
    ]

    const result = searchChallengeSolvedService()

    expect(result).toEqual(expectedSolutions)
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBe(expectedSolutions.length)
  })

  it('should return objects with label and value properties', () => {
    const result = searchChallengeSolvedService()

    result.forEach((solution) => {
      expect(solution).toHaveProperty('label')
      expect(solution).toHaveProperty('value')
    })
  })

  it('should correctly map "Solved" to true and "Not Solved" to false', () => {
    const result = searchChallengeSolvedService()

    expect(result.find((item) => item.label === 'Solved').value).toBe(true)
    expect(result.find((item) => item.label === 'Not Solved').value).toBe(false)
  })
})
