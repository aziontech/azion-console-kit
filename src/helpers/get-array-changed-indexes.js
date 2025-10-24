/**
 * Gets the changed indices from an array.
 * @param {Array} originalArray - The original array.
 * @param {Number} dragIndex - The dragIndex number.
 * @param {Number} dropIndex - The dropIndex number.
 * @returns {Array} The changed items with old and new indices.
 */
export const getArrayChangedIndexes = (originalArray, dragIndex, dropIndex) => {
  const updatedArray = [...originalArray]

  const [draggedItem] = updatedArray.splice(dragIndex, 1)

  updatedArray.splice(dropIndex, 0, draggedItem)

  return updatedArray
}
