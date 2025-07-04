import { capitalizeFirstLetter } from '@/helpers'
import { parseStatusData, parseDefaultData } from '../utils/adapter/parse-status-utils'
import { formatExhibitionDate } from '@/helpers/convert-date'
import { adaptServiceDataResponse } from '@/services/v2/utils/adaptServiceDataResponse'

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

const transformMap = {
  id: (value) => value.id,
  name: (value) => value.name,
  lastEditor: (value) => value.last_editor,
  lastModify: (value) => formatExhibitionDate(value.last_modified, 'full', undefined),
  lastModified: (value) => value.last_modified,
  active: (value) => parseStatusData(value.active),
  default: (value) => parseDefaultData(value?.default)
}

export const CustomPageAdapter = {
  transformListCustomPage(data, fields) {
    return adaptServiceDataResponse(data, fields, transformMap)
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
