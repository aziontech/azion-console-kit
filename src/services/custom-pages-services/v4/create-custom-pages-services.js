import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { makeCustomPagesBaseUrl } from './make-custom-pages-base-url'
import * as Errors from '@/services/axios/errors'
import { extractApiError } from '@/helpers/extract-api-error'

export const createCustomPagesService = async (payload) => {
  const parsedBody = adapt(payload)
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeCustomPagesBaseUrl()}`,
    method: 'POST',
    body: parsedBody
  })

  return parseHttpResponse(httpResponse)
}

const nullable = (value) => {
  return value ? value : null
}

const adapt = (payload) => {
  const pages = payload.pages.map((page) => {
    return {
      code: page.code.value?.toLowerCase(),
      ttl: page.ttl,
      uri: nullable(page.uri),
      custom_status_code: nullable(page.customStatusCode)
    }
  })
  return {
    name: payload.name,
    active: payload.isActive,
    default: payload.isDefault,
    connector_custom_pages: {
      edge_connector: nullable(payload.edgeConnectorId),
      pages
    }
  }
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @returns {string} The formatted error message.
 */
const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 202:
      return {
        feedback: 'Custom Page successfully created',
        urlToEditView: `/custom-pages/edit/${httpResponse.body.data.id}`,
        id: httpResponse.body.data.id
      }
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Error(extractApiError(httpResponse)).message
  }
}
