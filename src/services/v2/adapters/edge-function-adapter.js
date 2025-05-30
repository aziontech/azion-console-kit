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

const transformMap = {
  id: (value) => value.id,
  active: (value) => value.active,
  language: (value) => value.language,
  initiatorType: (value) => value.initiator_type,
  lastEditor: (value) => value.last_editor,
  referenceCount: (value) => value.reference_count,
  jsonArgs: (value) => JSON.stringify(value.json_args, null, 2),
  name: (value) => value.name,
  code: (value) => value.code,
  version: (value) => value.version || '-',
  lastModified: (value) =>
    value.last_modified
      ? new Intl.DateTimeFormat('us', { dateStyle: 'full' })?.format(new Date(value.last_modified))
      : null,
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

    if (fields.includes('active') || fields.includes('language')) {
      return {
        ...adapt,
        statusTag: STATUS_AS_TAG[data.active],
        languageIcon: LANGUAGE_WITH_ICON[data.language]
      }
    }

    return adapt
  },

  transformEdgeFunctionsDropdown(data, fields) {
    return adaptServiceDataResponse(data, fields, transformMap)
  }
}
