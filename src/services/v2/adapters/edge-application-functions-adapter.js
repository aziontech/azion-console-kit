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
  edgeFunction: (value) => value.function,
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
    const response = {
      id: data.id,
      edgeFunctionID: data.function,
      name: data.name,
      args: JSON.stringify(data.args, null, '\t')
    }

    if (data.azion_form) {
      response.azionForm = JSON.stringify(data.azion_form, null, '\t')
    }

    return response
  },

  transformPayload(payload) {
    const payloadRequest = {
      name: payload.name,
      function: payload.edgeFunctionID,
      args: JSON.parse(payload.args),
      active: true
    }

    if (payload.azionForm) {
      payloadRequest.azion_form = JSON.parse(payload.azionForm)
    }

    return payloadRequest
  },

  transformEditPayload(payload) {
    return {
      name: payload.name,
      function: payload.edgeFunctionID,
      args: JSON.parse(payload.args)
    }
  }
}
