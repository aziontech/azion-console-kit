/**
 * @param {string} url - url used to calculate the environment.
 * @returns {'development'|'stage'|'production'}
 */
export const getEnvironment = () => {
  return import.meta.env.MODE
}
