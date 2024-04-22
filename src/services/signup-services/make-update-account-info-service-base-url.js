export const makeUpdateAccountInfoServiceBaseUrl = (accountId) => {
  const version = 'v4'

  return `${version}/iam/accounts/${accountId}`
}
