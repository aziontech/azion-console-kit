/**
 * @returns {'development'|'stage'|'production'}
 */
export const getEnvironment = () => {
  // eslint-disable-next-line no-console
  console.log('Current environment:', import.meta.env)
  return import.meta.env.MODE
}
