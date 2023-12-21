const createIndexMap = (array) => {
  return array.reduce((accumulator, item, index) => {
    accumulator[item.id] = index
    return accumulator
  }, {})
}
const createChangedItem = (item, originalIndexMap, updatedIndexMap) => {
  return {
    oldIndex: originalIndexMap[item.id],
    newIndex: updatedIndexMap[item.id],
    ...item
  }
}

const getChangedItems = (array, originalIndexMap, updatedIndexMap) => {
  const changedItems = []

  for (const id in originalIndexMap) {
    if (originalIndexMap[id] !== updatedIndexMap[id]) {
      const item = array.find((item) => String(item.id) === id)
      changedItems.push(createChangedItem(item, originalIndexMap, updatedIndexMap))
    }
  }

  return changedItems
}

export const getArrayChangedIndices = (originalArray, updatedArray) => {
  const originalIndexMap = createIndexMap(originalArray)
  const updatedIndexMap = createIndexMap(updatedArray)

  return getChangedItems(originalArray, originalIndexMap, updatedIndexMap)
}
