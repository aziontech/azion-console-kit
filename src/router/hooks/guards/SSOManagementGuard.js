/** @type {import('vue-router').NavigationGuardWithThis} */

export function ssoManagementGuard({ to, accountStore }) {
  if (to.name === 'identity-providers' && !accountStore.hasAccessToSSOManagement) {
    return '/'
  }
}
