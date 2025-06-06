import {
  adaptServiceDataResponse,
  adaptServiceDataResponseToLoad
} from '@/services/v2/utils/adaptServiceDataResponse'

const STATUS_AS_TAG = {
  true: {
    content: 'Active',
    severity: 'success'
  },
  false: {
    content: 'Inactive',
    severity: 'danger'
  }
}

const LANGUAGE_WITH_ICON = {
  javascript: {
    content: 'JavaScript',
    icon: 'javascript'
  },
  lua: {
    content: 'Lua',
    icon: 'lua'
  }
}

const parseLastEditor = (edgeFunctionData) => {
  return edgeFunctionData?.version && edgeFunctionData?.vendor
    ? edgeFunctionData.vendor
    : edgeFunctionData.last_editor
}

const parseName = (edgeFunctionData) => {
  const nameProps = { text: edgeFunctionData.name, tagProps: {} }

  if (edgeFunctionData?.version && edgeFunctionData?.vendor) {
    nameProps.tagProps = {
      icon: 'pi pi-cart-plus',
      value: 'Integration',
      outlined: true,
      severity: 'info'
    }
  }

  return nameProps
}

const transformMap = {
  id: (value) => value.id,
  active: (value) => value.active,
  language: (value) => value.language,
  initiatorType: (value) => value.initiator_type,
  lastEditor: (value) => value.last_editor,
  referenceCount: (value) => value.reference_count,
  defaultArgs: (value) => JSON.stringify(value.default_args, null, 2),
  name: (value) => value.name,
  code: (value) => value.code,
  version: (value) => value.version || '-',
  isProprietaryCode: (value) => value.is_proprietary_code || false
}

export const EdgeFunctionsAdapter = {
  transformLoadEdgeFunctionByEdgeApplicationFunction(edgeApplicationFunction, edgeFunction) {
    return {
      id: edgeApplicationFunction.id,
      name: edgeApplicationFunction.name,
      functionInstanced: edgeFunction.data.name,
      lastEditor: edgeApplicationFunction.lastEditor,
      modified: edgeApplicationFunction.lastModified,
      version: edgeFunction.data.version
    }
  },

  transformLoadEdgeFunction({ data }, fields) {
    const adapt = adaptServiceDataResponseToLoad(data, fields, transformMap)

    return adapt
  },

  transformEdgeFunctionsDropdown(data, fields) {
    return adaptServiceDataResponse(data, fields, transformMap)
  },

  transformEdgeFunctions(data, fields) {
    return adaptServiceDataResponse(data, fields, transformMap)
  },

  transformListEdgeFunction(data) {
    return (
      data?.map((edgeFunction) => {
        return {
          status: STATUS_AS_TAG[edgeFunction.active],
          version: edgeFunction.version || '-',
          language: LANGUAGE_WITH_ICON[edgeFunction.language],
          initiatorType: edgeFunction.initiator_type,
          id: edgeFunction.id,
          lastEditor: parseLastEditor(edgeFunction),
          name: parseName(edgeFunction),
          referenceCount: edgeFunction.reference_count
        }
      }) || []
    )
  },

  transformPayloadEdgeFunctions(payload) {
    const parsedArgs = JSON.parse(payload.defaultArgs)
    return {
      name: payload.name,
      code: payload.code,
      language: payload.language,
      initiator_type: payload.initiatorType,
      default_args: parsedArgs,
      active: payload.active
    }
  }
}
