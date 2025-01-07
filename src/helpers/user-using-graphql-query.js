export const userUsingGraphqlQuery = (filter) => {
    if (!filter?.isUserUsingGraphqlQuery) return null
    return { query: `${filter?.graphqlQuery}` }
}
