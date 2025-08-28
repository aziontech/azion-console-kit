export const removeAmountOfHours = (offset, userUTC) => {
  const date = new Date()
  const begin = date.removeSelectedAmountOfHours(offset)
  const end = date.removeSelectedAmountOfHours(0)

  return [begin.toUTC(userUTC), end.toUTC(userUTC)]
}