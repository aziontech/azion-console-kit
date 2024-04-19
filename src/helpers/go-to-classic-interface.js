import { getEnvironment } from './get-environment'
export const goToClassicInterface = () => {
  const environment = getEnvironment()
  switch (environment) {
    case 'production':
      window.open('https://manager.azion.com')
      break
    case 'stage':
    case 'development':
      window.open('https://stage-manager.azion.com')
      break
    default:
      break
  }
}
