export const makeBaseUrl = () => {
  const { VITE_ENVIRONMENT, MODE } = import.meta.env
  const environmentPrefix =
    VITE_ENVIRONMENT === 'production' || MODE === 'production' ? '' : 'stage-'
  return `https://${environmentPrefix}ai.azion.com/copilot/chat/completions`
}
