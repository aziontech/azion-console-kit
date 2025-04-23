export const removeAmountOfHours = (offset, userUTC) => {
  const date = new Date()
  const begin = date.removeSelectedAmountOfHours(offset)
  const end = date.removeSelectedAmountOfHours(0)

  return [begin.toUTC(userUTC), end.toUTC(userUTC)]
}

export const updatedTimeRange = (begin, end, userUTC) => {
  const dateBegin = begin.resetUTC(userUTC).toBeholderFormat()
  const dateEnd = end.resetUTC(userUTC).toBeholderFormat()

  return {
    tsRangeBegin: dateBegin,
    tsRangeEnd: dateEnd
  }
}
