import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeKnowledgeBaseBaseUrl } from './make-knowledge-base-base-url'
import { extractApiError } from '@/helpers/extract-api-error'

export const loadKnowledgeBaseService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeKnowledgeBaseBaseUrl()}/${id}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  if (httpResponse.statusCode !== 200) {
    throw new Error(extractApiError({ body: httpResponse.body })).message
  }

  const parsedKnowledgeBase = {
    id: httpResponse.body.uuid || httpResponse.body.id,
    name: httpResponse.body.name,
    description: httpResponse.body.description,
    category: httpResponse.body.category,
    content: httpResponse.body.content
  }

  return {
    body: parsedKnowledgeBase,
    statusCode: httpResponse.statusCode
  }
}