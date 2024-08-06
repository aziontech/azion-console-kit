/**
 * Formats a given number as a currency string based on the provided locale and currency.
 * If the currency is undefined, it does not display the currency.
 * If the number is undefined, it returns the formatted string for zero.
 *
 * @param {string} [currency] - The currency code to be used for formatting. If undefined, currency is not displayed.
 * @param {number} [value=0] - The number to be formatted as currency. Defaults to 0 if undefined.
 * @param {string} [locale='en-US'] - The locale to be used for formatting. Defaults to 'en-US' if undefined.
 * @returns {string} The formatted currency string, or the number formatted according to the locale if currency is not provided.
 */
const formatCurrencyString = (currency, value = 0, locale = 'en-US') => {
  const options = {}
  if (currency) {
    options.style = 'currency'
    options.currency = currency
    options.currencyDisplay = 'code'
  }
  return new Intl.NumberFormat(locale, options).format(value)
}

/**
 * Formats a given number as a unit string based on the provided locale, unit, and decimal precision.
 *
 * @param {number} [value=0] - The number to be formatted.
 * @param {string} [unit] - The unit to be displayed after the number. If undefined, no unit is displayed.
 * @param {number} [minimumFractionDigits=0] - The minimum number of decimal places to display. Defaults to 0 if undefined.
 * @param {number} [maximumFractionDigits=3] - The maximum number of decimal places to display. Defaults to 3 if undefined.
 * @param {string} [locale='en-US'] - The locale to be used for formatting. Defaults to 'en-US' if undefined.
 * @returns {string} The formatted unit string, which includes the number followed by the unit if provided.
 */
const formatUnitValue = (
  value = 0,
  unit,
  minimumFractionDigits = 0,
  maximumFractionDigits = 3,
  locale = 'en-US'
) => {
  let formattedValue = new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits
  }).format(value)
  if (unit) {
    formattedValue += ` ${unit}`
  }
  return formattedValue
}

export { formatCurrencyString, formatUnitValue }
