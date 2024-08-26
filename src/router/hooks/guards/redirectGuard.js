/** @type {import('vue-router').NavigationGuardWithThis} */
export async function redirectAuth(to, next) {
  //verificar se esta indo para o /login e se sim verificar de onde
  if (to.path === '/login') {
    const redirect = to.query
    if (redirect && redirect.redirect) {
      return next(redirect.redirect)
    }
  }
}
