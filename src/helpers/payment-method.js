/**
 * Check if the date is expired and return a string value 'Expired' if it is
 *
 * @param {number} month - The month
 * @param {number} year - The year
 * @returns {string} The string value
 */

const getExpiredDate = (month, year) => {
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  const isExpiredByYear = year < currentYear
  const isExpiredByMonth = year === currentYear && month < currentMonth

  return isExpiredByYear || isExpiredByMonth ? 'Expired' : ''
}

export { getExpiredDate }
