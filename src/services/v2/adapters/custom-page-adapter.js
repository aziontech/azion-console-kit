import { capitalizeFirstLetter } from '@/helpers'
import { parseStatusData, parseDefaultData } from '../utils/adapter/parse-status-utils'
import { formatExhibitionDate } from '@/helpers/convert-date'

const nullable = (value) => {
  return value ? value : null
}

const typesPage = {
  default: 'PageDefault',
  connector: 'PageConnector',
  custom: 'PageCustom'
}

const getPageAttributes = (type, page) => {
  const typeAttributes = {
    connector: {
      connector: page.connector,
      ttl: page.ttl,
      uri: page.uri
    },
    default: {
      content_type: page.contentType,
      response: page.response
    }
  }

  return {
    ...(typeAttributes[type] || {}),
    custom_status_code: page.custom_status_code
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
          lastModified: formatExhibitionDate(customPage.last_modified, 'full', undefined),
          lastModifyDate: customPage.last_modified,
          active: parseStatusData(customPage?.active),
          default: parseDefaultData(customPage?.default)
        }
      }) || []
    )
  },
  transformPayloadCustomPage(payload) {
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
  },
  transformLoadCustomPage({ data }) {
    const pages = data.connector_custom_pages.pages.map((page) => {
      return {
        code: capitalizeFirstLetter(page.code),
        ttl: page.ttl,
        uri: page.uri,
        customStatusCode: page.custom_status_code
      }
    })

    return {
      id: data.id,
      name: data.name,
      lastEditor: data.last_editor,
      lastModified: data.last_modified,
      isActive: data.active,
      isDefault: data.default,
      productVersion: data.product_version,
      edgeConnectorId: data.connector_custom_pages.edge_connector,
      pages
    }
  },
  transformLoadCustomPageStatusCode({ data }) {
    return {
      id: data.id,
      name: data.name,
      last_editor: data.last_editor,
      last_modified: data.last_modified,
      active: data.active,
      product_version: data.product_version,
      pages: data.pages.map(({ type, ...page }) => ({
        code: page.code,
        page: {
          type: typesPage[type],
          attributes: getPageAttributes(type, page)
        }
      }))
    }
  }
}
