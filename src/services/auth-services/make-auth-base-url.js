export const makeLoginBaseUrl = () => {
  return {
    token: 'sso_api/token',
    switchAccount: 'sso_api/switch-account'
  }
}

export const makeLogoutBaseUrl = () => {
  return 'logout'
}
