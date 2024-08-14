import { describe, it, expect } from 'vitest'
import { getCsvCellContentFromRowData } from '@/helpers'

const makeSut = () => ({ sut: getCsvCellContentFromRowData })

describe('getCsvCellContentFromRowData', () => {
  it.each([
    {
      field: 'email',
      data: { content: 'test_email@email.com' },
      expectedResult: 'test_email@email.com'
    },
    {
      field: 'severity',
      data: { text: 'Warning' },
      expectedResult: 'Warning'
    }
  ])('should return the correct content for field: $field', (rowDataMock) => {
    const { sut } = makeSut()
    const columnMapperMock = {
      email: rowDataMock.data.content,
      severity: rowDataMock.data.text
    }

    const output = sut({ columnMapper: columnMapperMock, rowData: rowDataMock })

    expect(output).toBe(rowDataMock.expectedResult)
  })

  it('should return mapped cell content without matching field', () => {
    const { sut } = makeSut()
    const rowDataMock = {
      field: 'email',
      data: 'johndoe@example.email.com'
    }
    const userNameRowDataStub = {
      field: 'email',
      data: { text: 'John Doe' }
    }
    const mapperMock = {
      name: userNameRowDataStub.data.text
    }

    const rowDataWithoutMatchingFieldOutput = sut({
      columnMapper: mapperMock,
      rowData: rowDataMock
    })

    expect(rowDataWithoutMatchingFieldOutput).toBe('johndoe@example.email.com')
  })
})
