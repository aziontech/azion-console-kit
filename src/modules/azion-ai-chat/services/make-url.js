export const makeBaseUrl = () => {
  const { VITE_ENVIRONMENT, MODE } = import.meta.env
  const environment = VITE_ENVIRONMENT || MODE
  const environmentPrefix = environment === 'production' ? '' : 'stage-'
  return `https://${environmentPrefix}ai.azion.com/copilot/chat/completions`
}
