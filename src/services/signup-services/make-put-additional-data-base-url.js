export const makePutAdditionalDataBaseUrl = (id) => {
  const version = 'v4'
  return `${version}/iam/${id}/additional_data`
}
