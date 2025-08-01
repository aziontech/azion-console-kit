import { formatDateToDayMonthYearHour } from '@/helpers/convert-date'
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
  edgeFunction: (value) => value.edge_function,
  name: (value) => parseName(value),
  jsonArgs: (value) => JSON.stringify(value.args, null, '\t'),
  lastEditor: (value) => value.last_editor,
  lastModified: (value) => formatDateToDayMonthYearHour(value.last_modified)
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
      edgeFunctionID: data.edge_function,
      name: data.name,
      args: JSON.stringify(data.args, null, '\t')
    }
  },

  transformPayload(payload) {
    return {
      name: payload.name,
      edge_function: payload.edgeFunctionID,
      args: JSON.parse(payload.args),
      active: true
    }
  },

  transformEditPayload(payload) {
    return {
      name: payload.name,
      edge_function: payload.edgeFunctionID,
      args: JSON.parse(payload.args)
    }
  }
}
