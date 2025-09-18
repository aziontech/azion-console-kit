import {
  adaptServiceDataResponse,
  adaptServiceDataResponseToLoad
} from '@/services/v2/utils/adaptServiceDataResponse'
import { formatDateToDayMonthYearHour, convertToRelativeTime } from '@/helpers/convert-date'

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
  azion_js: {
    content: 'JavaScript',
    format: 'javascript',
    icon: 'javascript'
  },
  azion_lua: {
    content: 'Lua',
    format: 'lua',
    icon: 'lua'
  }
}

const CODE_LANG = {
  javascript: 'azion_js',
  lua: 'azion_lua'
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
  runtime: (value) => value.runtime,
  executionEnvironment: (value) => value.execution_environment,
  lastEditor: (value) => value.last_editor,
  referenceCount: (value) => value.reference_count,
  azionForm: (value) => JSON.stringify(value.azion_form, null, 2),
  defaultArgs: (value) => JSON.stringify(value.default_args, null, 2),
  name: (value) => value.name,
  code: (value) => value.code,
  version: (value) => value.version || '-',
  vendor: (value) => value.vendor || '-',
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
    adapt.runtimeFormat = LANGUAGE_WITH_ICON[adapt.runtime]

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
          runtime: LANGUAGE_WITH_ICON[edgeFunction.runtime] || {},
          executionEnvironment: edgeFunction.execution_environment,
          id: edgeFunction.id,
          lastEditor: parseLastEditor(edgeFunction),
          name: parseName(edgeFunction),
          vendor: edgeFunction.vendor,
          referenceCount: edgeFunction.reference_count,
          lastModify: convertToRelativeTime(edgeFunction.last_modified),
          lastModified: formatDateToDayMonthYearHour(edgeFunction.last_modified)
        }
      }) || []
    )
  },

  transformPayloadEdgeFunctions(payload) {
    const parsedArgs = JSON.parse(payload.defaultArgs)
    return {
      name: payload.name,
      code: payload.code,
      runtime: CODE_LANG[payload.runtime],
      execution_environment: payload.executionEnvironment,
      default_args: parsedArgs,
      azion_form: payload.azionForm,
      active: payload.active
    }
  }
}
