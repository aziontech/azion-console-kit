import { isProduction } from '@/helpers/get-environment'

export const makeBaseUrl = () => {
  const environmentPrefix = isProduction() ? '' : 'stage-'
  return `https://${environmentPrefix}ai.azion.com/copilot/chat/completions`
}
