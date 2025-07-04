import { parseStatusData } from '../utils/adapter/parse-status-utils'
import { formatExhibitionDate } from '@/helpers/convert-date'

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

export const CustomPageAdapter = {
  transformListCustomPage(data) {
    return (
      data?.map((customPage) => {
        return {
          id: customPage?.id,
          name: customPage?.name,
          lastEditor: customPage?.last_editor,
          lastModified: formatExhibitionDate(customPage?.last_modified, 'full', undefined),
          lastModifyDate: customPage?.last_modified,
          active: parseStatusData(customPage?.active)
        }
      }) || []
    )
  },
  transformPayloadCreateCustomPage(payload) {
    const pages = payload.pages.filter((page) => page.type !== 'PageDefault')

    return {
      name: payload.name,
      active: payload.active,
      pages: [
        ...pages.map((page) => {
          return {
            code: page.code.toLowerCase(),
            page: getPage(page)
          }
        }),
        {
          code: 'default',
          page: {
            type: 'PageDefault'
          }
        }
      ]
    }
  },
  transformLoadCustomPage({ data }) {
    return {
      id: data.id,
      name: data.name,
      last_editor: data.last_editor,
      last_modified: data.last_modified,
      active: data.active,
      product_version: data.product_version,
      pages: data.pages.map((item) => ({
        code: nullable(item.code),
        type: nullable(item.page.type),
        customStatusCode: nullable(item.page.attributes.custom_status_code),
        connector: nullable(item.page.attributes.connector),
        ttl: nullable(item.page.attributes.ttl),
        uri: nullable(item.page.attributes.uri),
        contentType: nullable(item.page.attributes.content_type),
        response: nullable(item.page.attributes.response)
      }))
    }
  }
}
