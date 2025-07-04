import { formatExhibitionDate } from '@/helpers/convert-date'

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

export const EdgeAppAdapter = {
  transformListEdgeApp(data, isDropdown) {
    return (
      data?.map((edgeApplication) => {
        return {
          id: edgeApplication.id,
          name: isDropdown ? edgeApplication.name : parseName(edgeApplication),
          disableEditClick: edgeApplication.product_version === LOCKED_VALUE,
          lastEditor: edgeApplication.last_editor,
          lastModify: formatExhibitionDate(edgeApplication.last_modified, 'full'),
          lastModified: edgeApplication.last_modified,
          active: edgeApplication.active,
          isLocked: edgeApplication.product_version === LOCKED_VALUE
        }
      }) || []
    )
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
