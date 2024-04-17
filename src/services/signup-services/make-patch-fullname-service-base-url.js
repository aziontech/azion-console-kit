export const makePatchFullnameServiceBaseUrl = (userId) => {
  const version = 'v4'

  return `${version}/iam/users/${userId}`
}
