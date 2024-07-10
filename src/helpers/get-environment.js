/**
 * @returns {'development'|'stage'|'production'}
 */
export const getEnvironment = () => {
  const environment = import.meta.env
  console.log('🚀 ~ getEnvironment ~ environment:', environment);
  return environment.MODE
}
