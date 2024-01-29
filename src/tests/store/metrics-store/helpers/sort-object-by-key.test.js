import SortObjectByKey from '@/stores/metrics-store/helpers/sort-object-by-key'
import { describe, expect, it } from 'vitest'

const makeSut = () => {
  const sut = SortObjectByKey

  return { sut }
}
const mockObjects = {
  unsorted: {
    second: 'second',
    third: 'third',
    first: 'first'
  },
  sorted: {
    first: 'first',
    second: 'second',
    third: 'third'
  }
}

describe('OrderObjectByKey', () => {
  it('should sort by key', () => {
    const { sut } = makeSut()

    const sortedObject = sut(mockObjects.unsorted)

    expect(sortedObject).toStrictEqual(mockObjects.sorted)
  })
})
