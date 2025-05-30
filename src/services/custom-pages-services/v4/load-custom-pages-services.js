import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeCustomPagesBaseUrl } from './make-custom-pages-base-url'
import { capitalizeFirstLetter } from '@/helpers'
import { extractApiError } from '@/helpers/extract-api-error'

export const loadCustomPagesService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeCustomPagesBaseUrl()}/${id}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  if (httpResponse.statusCode !== 200) {
    throw new Error(extractApiError({ body: httpResponse.body })).message
  }
  const customPage = httpResponse.body?.data

  const pages = customPage.connector_custom_pages.pages.map((page) => {
    return {
      code: capitalizeFirstLetter(page.code),
      ttl: page.ttl,
      uri: page.uri,
      customStatusCode: page.custom_status_code
    }
  })

  const parsedCustomPage = {
    id: customPage.id,
    name: customPage.name,
    lastEditor: customPage.last_editor,
    lastModified: customPage.last_modified,
    isActive: customPage.active,
    isDefault: customPage.default,
    productVersion: customPage.product_version,
    edgeConnectorId: customPage.connector_custom_pages.edge_connector,
    pages
  }

  return {
    body: parsedCustomPage,
    statusCode: httpResponse.statusCode
  }
}
