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
  name: (value) => (value.product_version === LOCKED_VALUE ? parseName(value.name) : value.name),
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
  transformLoadEdgeApp({ data }) {
    return {
      id: data?.id,
      name: data?.name,
      edgeCacheEnabled: data?.modules?.edge_cache_enabled,
      edgeFunctionsEnabled: data?.modules?.edge_functions_enabled,
      applicationAcceleratorEnabled: data?.modules?.application_accelerator_enabled,
      imageProcessorEnabled: data?.modules?.image_processor_enabled,
      tieredCacheEnabled: data?.modules?.tiered_cache_enabled,
      isActive: data?.active,
      debug: data?.debug,
      productVersion: data?.product_version
    }
  },
  transformPayloadEdit(payload) {
    return {
      name: payload.name,
      modules: {
        edge_cache_enabled: payload.edgeCacheEnabled,
        edge_functions_enabled: payload.edgeFunctionsEnabled,
        application_accelerator_enabled: payload.applicationAcceleratorEnabled,
        image_processor_enabled: payload.imageProcessorEnabled,
        tiered_cache_enabled: payload.tieredCacheEnabled
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
