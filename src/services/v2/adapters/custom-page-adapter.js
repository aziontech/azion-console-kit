import { parseStatusData } from '../utils/adapter/parse-status-utils'
import { formatExhibitionDate } from '@/helpers/convert-date'
import { adaptServiceDataResponse } from '@/services/v2/utils/adaptServiceDataResponse'

const nullable = (value) => ([null, undefined, '-', ''].includes(value) ? null : value)

const getPage = (page) => {
  const typeAttributes = {
    PageConnector: {
      connector: nullable(page.connector),
      ttl: nullable(page.ttl),
      uri: nullable(page.uri),
      custom_status_code: nullable(page.customStatusCode)
    },
    PageDefault: {
      content_type: nullable(page.contentType),
      response: nullable(page.response)
    }
  }

  return {
    type: page.type,
    attributes: {
      ...(typeAttributes[page.type] || {}),
      custom_status_code: nullable(page.customStatusCode)
    }
  }
}

const transformMap = {
  id: (value) => value.id,
  name: (value) => value.name,
  lastEditor: (value) => value.last_editor,
  lastModify: (value) => formatExhibitionDate(value.last_modified, 'full', undefined),
  lastModified: (value) => value.last_modified,
  active: (value) => parseStatusData(value.active)
}

export const CustomPageAdapter = {
  transformListCustomPage(data, fields) {
    return adaptServiceDataResponse(data, fields, transformMap)
  },
  transformPayloadCreateCustomPage(payload) {
    const pages = payload.pages.filter((page) => page.type !== 'PageDefault')
    const hasCodeDefault = pages.find((page) => page.code.value?.toLowerCase() === 'default')

    return {
      name: payload.name,
      active: payload.active,
      pages: [
        ...pages.map((page) => {
          return {
            code: page.code.value?.toLowerCase(),
            page: getPage(page)
          }
        }),
        // REMOVE THIS AS SOON AS THE API STARTS WORKING PROPERLY
        ...(!hasCodeDefault
          ? [
              {
                code: 'default',
                page: {
                  type: 'PageDefault'
                }
              }
            ]
          : [])
      ]
    }
  },
  transformLoadCustomPage({ data }) {
    const response = {
      id: data.id,
      name: data.name,
      last_editor: data.last_editor,
      last_modified: data.last_modified,
      active: data.active,
      product_version: data.product_version,
      pages: data.pages.map((item) => ({
        code: { value: nullable(item.code) },
        type: nullable(item.page.type),
        customStatusCode: nullable(item.page.attributes.custom_status_code),
        connector: nullable(item.page.attributes.connector),
        ttl: nullable(item.page.attributes.ttl),
        uri: nullable(item.page.attributes.uri),
        contentType: nullable(item.page.attributes.content_type),
        response: nullable(item.page.attributes.response)
      }))
    }

    // REMOVE THIS AS SOON AS THE API STARTS WORKING PROPERLY
    response.pages = response.pages.filter((page) => page.type !== 'PageDefault')

    return response
  }
}
