export const makePostAdditionalDataBaseUrl = (id) => {
  const version = 'v4'
  return `${version}/iam/${id}/additional_data`
}
