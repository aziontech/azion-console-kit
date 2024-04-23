export const generateFormattedTimestamp = () => {
  const currentDate = new Date()

  const formatNumber = (number) => String(number).padStart(2, '0')

  const year = currentDate.getFullYear().toString()
  const month = formatNumber(currentDate.getMonth() + 1)
  const day = formatNumber(currentDate.getDate())
  const hours = formatNumber(currentDate.getHours())
  const minutes = formatNumber(currentDate.getMinutes())
  const seconds = formatNumber(currentDate.getSeconds())

  const formattedTimestamp = `${year}${month}${day}${hours}${minutes}${seconds}`
  return formattedTimestamp
}
