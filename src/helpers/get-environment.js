/**
 * @returns {'development'|'stage'|'production'}
 */
export const getEnvironment = () => {
  return import.meta.env.VITE_ENVIRONMENT
}
