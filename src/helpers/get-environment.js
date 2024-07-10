/**
 * @returns {'development'|'stage'|'production'}
 */
export const getEnvironment = () => {
  const environment = import.meta.env
  // eslint-disable-next-line no-console
  console.log('🚀 ~ getEnvironment ~ environment:', environment);
  return environment.VITE_ENVIRONMENT
}
