import { getEnvironment } from './get-environment'
export const goToClassicInterface = () => {
  const environment = getEnvironment()

  if (environment === 'production') {
    window.open('https://manager.azion.com')
  } else {
    window.open('https://stage-manager.azion.com')
  }
}
