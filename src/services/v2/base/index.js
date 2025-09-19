export { BaseService } from './BaseService'
export { enhancedQueryClient, queryClient } from './queryClient'
export { HttpService, httpService } from './httpService'
export * from './cache'

import { enhancedQueryClient } from './queryClient'
enhancedQueryClient.initializeEarly()