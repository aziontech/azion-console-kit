export const makePostAdditionalDataBaseUrl = (id) => {
  const version = 'v4'
  return `${version}/iam/users/${id}/additional_data`
}
