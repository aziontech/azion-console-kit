/** @type {import('vue-router').NavigationGuardWithThis} */

export function ssoManagementGuard({ to, accountStore }) {
  if (to.name === 'identity-providers') {
    if (!accountStore.hasAccessToSSOManagement) {
      return '/'
    }
  }
  return true
}
