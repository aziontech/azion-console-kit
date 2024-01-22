import FormatDatasetFilterToGQL from '@/stores/metrics-store/helpers/format-dataset-filter-to-gql'
import { describe, expect, it } from 'vitest'

const makeSut = () => {
  const sut = FormatDatasetFilterToGQL

  return { sut }
}

const scenarios = [
  {
    type: 'return an empty object when given an empty dataset array',
    datasets: [],
    expected: {}
  },
  {
    type: 'create a dataset filter object with field names as keys and sourceIds as values',
    datasets: [
      {
        fieldAlias: 'field1',
        fieldName: 'field1',
        in: [{ sourceId: '1' }, { sourceId: '2' }]
      },
      {
        fieldAlias: 'field2',
        fieldName: 'field2',
        in: [{ sourceId: '3' }, { sourceId: '4' }]
      },
      {
        fieldName: 'field3',
        in: []
      }
    ],
    expected: {
      field1: ['1', '2'],
      field2: ['3', '4'],
      field3: []
    }
  }
]

describe('formatDatasetFilterToGQL', () => {
  it.each(scenarios)('should $type', ({ datasets, expected }) => {
    const { sut } = makeSut()

    const result = sut(datasets)
    expect(result).toEqual(expected)
  })
})
