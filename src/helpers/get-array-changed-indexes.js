/**
 * Creates an index map from an array.
 * @param {Array} array - The array to be mapped.
 * @returns {Object} The index map.
 */
const createIndexMap = (array) => {
  return array.reduce((accumulator, item, index) => {
    accumulator[item.id] = index
    return accumulator
  }, {})
}

/**
 * Creates a changed item with old and new indices.
 * @param {Object} item - The item that was changed.
 * @param {Object} originalIndexMap - The original index map.
 * @param {Object} updatedIndexMap - The updated index map.
 * @returns {Object} The changed item with old and new indices.
 */
const createChangedItem = (item, originalIndexMap, updatedIndexMap) => {
  return {
    oldIndex: originalIndexMap[item.id],
    newIndex: updatedIndexMap[item.id],
    ...item
  }
}

/**
 * Gets the changed items from an array.
 * @param {Array} array - The array to be checked.
 * @param {Object} originalIndexMap - The original index map.
 * @param {Object} updatedIndexMap - The updated index map.
 * @returns {Array} The changed items.
 */
const getChangedItems = (array, originalIndexMap, updatedIndexMap, reorderAll) => {
  const changedItems = []

  for (const id in originalIndexMap) {
    if (reorderAll) {
      const item = array.find((item) => String(item.id) === id)
      changedItems.push(createChangedItem(item, originalIndexMap, updatedIndexMap))
    } else {
      if (originalIndexMap[id] !== updatedIndexMap[id] && !reorderAll) {
        const item = array.find((item) => String(item.id) === id)
        changedItems.push(createChangedItem(item, originalIndexMap, updatedIndexMap))
      }
    }
  }

  return changedItems
}

/**
 * Gets the changed indices from an array.
 * @param {Array} originalArray - The original array.
 * @param {Array} updatedArray - The updated array.
 * @returns {Array} The changed items with old and new indices.
 */
export const getArrayChangedIndexes = (originalArray, updatedArray, reorderAll) => {
  const originalIndexMap = createIndexMap(originalArray)
  const updatedIndexMap = createIndexMap(updatedArray)

  return getChangedItems(originalArray, originalIndexMap, updatedIndexMap, reorderAll)
}
