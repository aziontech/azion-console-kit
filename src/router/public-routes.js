const publicRoutesName = ['login', 'reset-password', 'authentication-mfa', 'setup-mfa']

const getPublicRoutesName = () => {
  return publicRoutesName
}

const isRoutePublic = (routeName) => {
  return publicRoutesName.includes(routeName)
}

export { getPublicRoutesName, isRoutePublic }
