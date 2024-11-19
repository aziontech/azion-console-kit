import { describe, expect, it } from 'vitest'
import { getArrayChangedIndexes } from '@/helpers/get-array-changed-indexes'

const fixtures = {
  dragIndex: 0,
  dropIndex: 4,
  originalArray: [
    {
      id: 351050,
      name: 'Default Rule'
    },
    {
      id: 353622,
      name: 'Test 1'
    },
    {
      id: 353623,
      name: 'Test 2'
    },
    {
      id: 353627,
      name: 'Test 3'
    },
    {
      id: 353628,
      name: 'Test 4'
    },
    {
      id: 353626,
      name: 'Test 5'
    }
  ]
}
const makeSut = () => {
  const sut = getArrayChangedIndexes

  return {
    sut
  }
}

describe('getArrayChangedIndexes', () => {
  it('should return the changed indexes of a array', () => {
    const { sut } = makeSut()

    const environment = sut(fixtures.originalArray, fixtures.dragIndex, fixtures.dropIndex)

    expect(environment).toStrictEqual([
      {
        id: 353622,
        name: 'Test 1'
      },
      {
        id: 353623,
        name: 'Test 2'
      },
      {
        id: 353627,
        name: 'Test 3'
      },
      {
        id: 353628,
        name: 'Test 4'
      },
      {
        id: 351050,
        name: 'Default Rule'
      },
      {
        id: 353626,
        name: 'Test 5'
      }
    ])
  })
})
