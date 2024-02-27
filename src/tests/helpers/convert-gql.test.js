import { describe, expect, it } from 'vitest'
import convertGQL from '@/helpers/convert-gql'

const makeSut = () => {
  const sut = convertGQL

  return {
    sut
  }
}

describe('convertGQL', () => {
  it('should convert filter and table to gql body when both filter and table are provided', async () => {
    const filter = {
      tsRange: { tsRangeBegin: '2022-01-01', tsRangeEnd: '2022-01-31' },
      and: { field1: 'value1', field2: 'value2' },
      in: { field3: ['value3', 'value4'] }
    }
    const table = {
      fields: ['field1', 'field2', 'field3'],
      dataset: 'myDataset',
      limit: 10,
      orderBy: 'field1'
    }

    const { sut } = makeSut()

    expect(sut(filter, table)).toEqual({
      query: expect.any(String),
      variables: {
        tsRange_begin: '2022-01-01',
        tsRange_end: '2022-01-31',
        and_field1: 'value1',
        and_field2: 'value2',
        in_field3: ['value3', 'value4']
      }
    })
  })

  it('should convert filter and table to gql body when only filter is provided', () => {
    const filter = {
      tsRange: { tsRangeBegin: '2022-01-01', tsRangeEnd: '2022-01-31' }
    }
    const table = {
      fields: ['field1', 'field2', 'field3'],
      dataset: 'myDataset',
      limit: 10,
      orderBy: 'field1'
    }

    const { sut } = makeSut()

    expect(sut(filter, table)).toEqual({
      query: expect.any(String),
      variables: {
        tsRange_begin: '2022-01-01',
        tsRange_end: '2022-01-31'
      }
    })
  })

  it('should convert filter and table to gql body when only table is provided', () => {
    const filter = null
    const table = {
      fields: ['field1', 'field2', 'field3'],
      dataset: 'myDataset',
      limit: 10,
      orderBy: 'field1'
    }

    const { sut } = makeSut()

    expect(sut(filter, table)).toEqual({
      query: expect.any(String),
      variables: {}
    })
  })

  it('should convert filter and table to gql body when no filter and no table are provided', async () => {
    const filter = null
    const table = null

    const { sut } = makeSut()

    expect(() => sut(filter, table)).toThrow('Table parameter is required')
  })

  it('should convert filter and table to gql body with complex filter and table configurations', () => {
    const filter = {
      tsRange: { tsRangeBegin: '2022-01-01', tsRangeEnd: '2022-01-31' },
      and: { field1: 'value1', field2: 'value2' },
      in: { field3: ['value3', 'value4'] }
    }
    const table = {
      fields: ['field1', 'field2', 'field3'],
      dataset: 'myDataset',
      limit: 10,
      orderBy: 'field1'
    }

    const { sut } = makeSut()

    expect(sut(filter, table)).toEqual({
      query: expect.any(String),
      variables: {
        tsRange_begin: '2022-01-01',
        tsRange_end: '2022-01-31',
        and_field1: 'value1',
        and_field2: 'value2',
        in_field3: ['value3', 'value4']
      }
    })
  })
})
