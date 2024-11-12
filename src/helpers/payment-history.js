const getLastDayMonth = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()

  const dateFinal = new Date(year, month + 1, 0)

  return dateFinal.toISOString().split('T')[0]
}

export { getLastDayMonth }
