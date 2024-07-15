/**
 * @returns {'development'|'stage'|'production'}
 */
export const getEnvironment = () => {
  const environment = import.meta.env

  return environment.VITE_ENVIRONMENT || environment.MODE
}
