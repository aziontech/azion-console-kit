export const openGraphQlPlayground = (baseUrl, query, variables) => {
  const encodedQuery = encodeURIComponent(query)
  const encodedVariables = encodeURIComponent(JSON.stringify(variables))

  const finalUrl = `${baseUrl}#query=${encodedQuery}&variables=${encodedVariables}`
  window.open(finalUrl, '_blank')
}
