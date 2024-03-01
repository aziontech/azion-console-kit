/**
 * @returns {'development'|'stage'|'production'}
 */
export const getEnvironment = () => {
  return import.meta.env.MODE
}
