import { formatDateToDayMonthYearHour, convertToRelativeTime } from '@/helpers/convert-date'
import { adaptServiceDataResponse } from '@/services/v2/utils/adaptServiceDataResponse'

const parseName = (data) => {
  const nameProps = { text: data.name, tagProps: {} }

  if (data?.version && data?.vendor) {
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
  id: (value) => value.id.toString(),
  edgeFunction: (value) => value.function,
  name: (value) => parseName(value),
  jsonArgs: (value) => JSON.stringify(value.args, null, '\t'),
  lastEditor: (value) => value.last_editor,
  lastModified: (value) => formatDateToDayMonthYearHour(value.last_modified),
  lastModifiedFormatted: (value) => convertToRelativeTime(value.last_modified)
}

export const EdgeApplicationFunctionsAdapter = {
  transformListFunctions(data, fields) {
    return adaptServiceDataResponse(data, fields, transformMap)
  },

  transformListFunctionsDropdown(data) {
    return data.map((item) => ({
      name: item.name,
      id: item.id
    }))
  },

  transformLoadEdgeApplicationFunction(functionData) {
    const { data } = functionData
    return {
      id: data.id,
      edgeFunctionID: data.function,
      name: data.name,
      args: JSON.stringify(data.args, null, '\t'),
      azionForm: JSON.stringify(data.azion_form, null, '\t')
    }
  },

  transformPayload(payload) {
    return {
      name: payload.name,
      function: payload.edgeFunctionID,
      args: JSON.parse(payload.args),
      active: true,
      azion_form: JSON.parse(payload.azionForm)
    }
  },

  transformEditPayload(payload) {
    return {
      name: payload.name,
      function: payload.edgeFunctionID,
      args: JSON.parse(payload.args),
      azion_form: JSON.parse(payload.azionForm)
    }
  }
}
