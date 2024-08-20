import { getStaticUrlsByEnvironment } from './get-static-urls-by-environment'
import { useGraphQLStore } from '@/stores/graphql-query'
import { openGraphQlPlayground } from './open-graphql-playground'

export const eventsPlaygroundOpener = () => {
  const playgroundUrl = getStaticUrlsByEnvironment('playgroundEvents')
  
  const { getLastQuery } = useGraphQLStore()
  const fullQuery = getLastQuery.query
  const variables = getLastQuery.variables

  openGraphQlPlayground(playgroundUrl, fullQuery, variables)
}
