/** @type {import('vue-router').NavigationGuardWithThis} */

export function ssoManagementGuard({ to, accountStore }) {
  if (to.fullPath.includes('identity-providers') && !accountStore.hasAccessToSSOManagement) {
    return '/'
  }
}
