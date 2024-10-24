/** @type {import('vue-router').NavigationGuardWithThis} */

export function SSOManagementGuard({ to, accountStore }) {
  if (to.name === 'identity-providers') {
    if (!accountStore.hasAccessToSSOManagement) {
      return '/'
    }
  } else {
    return true
  }
}
