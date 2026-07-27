import { getRuntimeConfig } from './runtime-config'

/**
 * @returns {'development'|'stage'|'production'}
 */
export const getEnvironment = () => {
  return getRuntimeConfig().environment || import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE
}

/**
 * @returns {boolean}
 */
export const isProduction = () => {
  return getEnvironment() === 'production'
}
