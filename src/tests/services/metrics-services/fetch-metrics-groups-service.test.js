import { fetchMetricsGroupsService } from '@/services/metrics-services'
import { describe, expect, it } from 'vitest'

const fixtures = [
  {
    id: 1,
    label: 'Build',
    value: 'build'
  },
  {
    id: 2,
    label: 'Secure',
    value: 'secure'
  },
  {
    id: 3,
    label: 'Observe',
    value: 'observe'
  }
]

const makeSut = () => {
  const sut = fetchMetricsGroupsService

  return {
    sut
  }
}

describe('MetricsServices', () => {
  it('should return a list of groups with correct values', async () => {
    const { sut } = makeSut()

    const groups = await sut()

    expect(groups).toEqual(fixtures)
  })
})
