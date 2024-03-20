import FormatDatasetVariables from '@/modules/real-time-metrics/helpers/format-dataset-variables'
import { describe, expect, it } from 'vitest'
import FIXTURES from './fixtures/format-dataset-variables-fixtures'

const makeSut = () => {
  const sut = FormatDatasetVariables

  return { sut }
}

const blacklistVariables = ['sum', 'count', 'avg', 'max', 'min', 'client_id']

describe('FormatDatasetVariables', () => {
  it('should sort by key', () => {
    const { sut } = makeSut()

    const sortedObject = sut(FIXTURES.datasets)

    expect(sortedObject).toStrictEqual(FIXTURES.transformedDatasets)
  })

  it.each(blacklistVariables)('should remove black listed fields: %s', (field) => {
    const { sut } = makeSut()

    const sortedObject = sut(FIXTURES.datasets)

    expect(sortedObject.httpMetrics).not.toHaveProperty(field)
  })
})
