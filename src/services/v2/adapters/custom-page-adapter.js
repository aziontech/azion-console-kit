import { capitalizeFirstLetter } from '@/helpers'
import { parseStatusData, parseDefaultData } from '../utils/adapter/parse-status-utils'

const nullable = (value) => {
  return value ? value : null
}

const convertDate = (date) => {
  let convertedDate
  try {
    convertedDate = new Date(date)
    if (isNaN(convertedDate)) throw new Error('Invalid Date')
  } catch (error) {
    convertedDate = null
  }
  return convertedDate
}

export const CustomPageAdapter = {
  transformListCustomPage(data) {
    return (
      data?.map((customPage) => {
        return {
          id: customPage?.id,
          name: customPage?.name,
          lastEditor: customPage?.last_editor,
          lastModified: convertDate(customPage?.last_modified),
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
  }
}
