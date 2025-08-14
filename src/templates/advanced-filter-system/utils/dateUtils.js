/**
 * Converte um valor e unidade de tempo para milissegundos
 * @param {number} value - Valor numérico
 * @param {string} unit - Unidade de tempo (seconds, minutes, hours, etc.)
 * @returns {number} Tempo em milissegundos
 */
export const getTimeInMs = (value, unit) => {
  const multipliers = {
    seconds: 1000,
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
    weeks: 7 * 24 * 60 * 60 * 1000,
    months: 30 * 24 * 60 * 60 * 1000,
    years: 365 * 24 * 60 * 60 * 1000
  }
  
  return value * (multipliers[unit] || 1000)
}

/**
 * Calcula uma data baseada em uma data de referência e valores relativos
 * @param {Date} referenceDate - Data de referência
 * @param {number} value - Valor numérico
 * @param {string} unit - Unidade de tempo
 * @param {string} direction - Direção (ago/from now)
 * @returns {Date} Nova data calculada
 */
export const calculateRelativeDate = (referenceDate, value, unit, direction) => {
  const timeInMs = getTimeInMs(value, unit)
  return direction === 'ago' 
    ? new Date(referenceDate.getTime() - timeInMs)
    : new Date(referenceDate.getTime() + timeInMs)
}

/**
 * Cria um intervalo de datas baseado em valores relativos
 * @param {number} value - Valor numérico
 * @param {string} unit - Unidade de tempo
 * @param {string} direction - Direção (ago/from now)
 * @param {Date} referenceDate - Data de referência (padrão: agora)
 * @returns {Object} Objeto com startDate e endDate
 */
export const createRelativeRange = (value, unit, direction, referenceDate = new Date()) => {
  const calculatedDate = calculateRelativeDate(referenceDate, value, unit, direction)
  
  return direction === 'ago'
    ? { startDate: calculatedDate, endDate: referenceDate }
    : { startDate: referenceDate, endDate: calculatedDate }
}

/**
 * Cria uma data para o início do dia
 * @param {Date} date - Data de referência
 * @returns {Date} Data no início do dia (00:00:00)
 */
export const createStartOfDay = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/**
 * Cria uma data para o final do dia
 * @param {Date} date - Data de referência
 * @returns {Date} Data no final do dia (23:59:59)
 */
export const createEndOfDay = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)
}

/**
 * Cria um intervalo para a semana atual
 * @param {Date} date - Data de referência
 * @returns {Object} Objeto com startDate e endDate da semana
 */
export const createWeekRange = (date) => {
  const startOfWeek = new Date(date)
  startOfWeek.setDate(date.getDate() - date.getDay())
  
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  
  return {
    startDate: createStartOfDay(startOfWeek),
    endDate: createEndOfDay(endOfWeek)
  }
}

/**
 * Valida se uma data é válida
 * @param {Date} date - Data a ser validada
 * @returns {boolean} True se a data é válida
 */
export const isValidDate = (date) => {
  return date instanceof Date && !isNaN(date.getTime())
}

/**
 * Formata uma data para exibição
 * @param {Date} date - Data a ser formatada
 * @param {boolean} short - Se deve usar formato curto (sem milissegundos)
 * @param {Object} options - Opções de formatação
 * @returns {string} Data formatada
 */
export const formatDateTime = (date, short = false, options = {}) => {
  if (!isValidDate(date)) return ''

  const defaultOptions = {
    short: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false // Formato 24 horas
    },
    long: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false // Formato 24 horas
    }
  }

  const formatOptions = options.short || defaultOptions.short
  const longOptions = options.long || defaultOptions.long

  let formatted = date.toLocaleDateString('en-US', short ? formatOptions : longOptions)

  if (!short) {
    const milliseconds = date.getMilliseconds().toString().padStart(3, '0')
    formatted += `.${milliseconds}`
  }

  return formatted
}

/**
 * Formata uma data para exibição simples (DD/MM/YYYY HH:mm)
 * @param {Date} date - Data a ser formatada
 * @returns {string} Data formatada no formato DD/MM/YYYY HH:mm
 */
export const formatDateSimple = (date) => {
  if (!isValidDate(date)) return ''
  
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  
  return `${day}/${month}/${year} ${hours}:${minutes}`
}

/**
 * Formata uma data para exibição com segundos (DD/MM/YYYY HH:mm:ss)
 * @param {Date} date - Data a ser formatada
 * @returns {string} Data formatada no formato DD/MM/YYYY HH:mm:ss
 */
export const formatDateWithSeconds = (date) => {
  if (!isValidDate(date)) return ''
  
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
}
