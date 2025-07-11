import { formatExhibitionDate } from '@/helpers/convert-date'
import { adaptServiceDataResponse } from '@/services/v2/utils/adaptServiceDataResponse'

const LOCKED_VALUE = 'custom'

const parseName = (edgeApplication) => {
  const nameProps = { text: edgeApplication.name, tagProps: {} }

  if (edgeApplication?.product_version === LOCKED_VALUE) {
    nameProps.tagProps = {
      icon: 'pi pi-lock',
      value: 'Locked',
      outlined: true,
      severity: 'warning'
    }
  }

  return nameProps
}

const transformMap = {
  id: (value) => value.id,
  active: (value) => value.active,
  name: (value) => parseName(value),
  lastEditor: (value) => value.last_editor,
  lastModify: (value) => formatExhibitionDate(value.last_modified, 'full', undefined),
  lastModified: (value) => value.last_modified,
  disableEditClick: (value) => value.product_version === LOCKED_VALUE,
  isLocked: (value) => value.product_version === LOCKED_VALUE
}

export const EdgeAppAdapter = {
  transformListEdgeApp(data, fields) {
    return adaptServiceDataResponse(data, fields, transformMap)
  },
  transformListDropdownEdgeApp(data) {
    return data.map((edgeApplication) => ({
      id: edgeApplication.id,
      name: edgeApplication.name
    }))
  },

  transformLoadEdgeApp({ data }) {
    return {
      id: data?.id,
      name: data?.name,
      edgeCacheEnabled: data?.modules?.edge_cache.enabled,
      edgeFunctionsEnabled: data?.modules?.edge_functions.enabled,
      applicationAcceleratorEnabled: data?.modules?.application_accelerator.enabled,
      imageProcessorEnabled: data?.modules?.image_processor.enabled,
      tieredCacheEnabled: data?.modules?.tiered_cache.enabled,
      isActive: data?.active,
      debug: data?.debug,
      productVersion: data?.product_version
    }
  },

  transformPayloadEdit(payload) {
    return {
      name: payload.name,
      modules: {
        edge_cache: { enabled: payload.edgeCacheEnabled },
        edge_functions: { enabled: payload.edgeFunctionsEnabled },
        application_accelerator: { enabled: payload.applicationAcceleratorEnabled },
        image_processor: { enabled: payload.imageProcessorEnabled },
        tiered_cache: { enabled: payload.tieredCacheEnabled }
      },
      active: payload.isActive,
      debug: payload.debug
    }
  },

  transformPayloadClone(payload) {
    return {
      id: payload.id,
      name: payload.edgeApplicationName
    }
  }
}
