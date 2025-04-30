import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { extractApiError } from '@/helpers/extract-api-error'
import { makeCustomPagesBaseUrl } from './make-custom-pages-base-url'

export const editCustomPagesService = async (payload) => {
  const parsedPayload = adapt(payload)
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeCustomPagesBaseUrl()}/${payload.id}`,
    method: 'PATCH',
    body: parsedPayload
  })

  return parseHttpResponse(httpResponse)
}

const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 202:
      return 'Your Custom Page has been updated!'
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Error(extractApiError(httpResponse)).message
  }
}

const nullable = (value) => {
  return value ? value : null
}

const adapt = (payload) => {
  const pages = payload.pages.map((page) => {
    return {
      code: page.code.toLowerCase(),
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
