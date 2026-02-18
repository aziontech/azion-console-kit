import { convertToRelativeTime, formatDateToDayMonthYearHour } from '@/helpers/convert-date'

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

const convertVariablesToString = (variables) => {
  return variables ? variables.map(({ name, value }) => `${name}=${value}`).join('\n') : ''
}

const parseCodeToVariables = (code) => {
  if (!code) return []
  const lines = code.trim().split(/\r?\n/)

  return lines.map((line) => {
    const [name, ...rest] = line.split('=')
    const value = rest.join('=')
    return { name: name.trim(), value: value.trim() }
  })
}

export const transformEdgeServiceItem = (rawData) => {
  const item = {
    id: rawData.id,
    name: rawData.name,
    active: rawData.active
  }
  if (rawData.variables) {
    item.code = convertVariablesToString(rawData.variables)
  }
  return item
}

export const EdgeServiceAdapter = {
  transformList(data) {
    return (
      data?.map((edgeService) => ({
        id: edgeService.id,
        name: edgeService.name,
        labelActive: STATUS_AS_TAG[edgeService.active],
        active: edgeService.active,
        lastEditor: edgeService.last_editor,
        lastModify: convertToRelativeTime(edgeService.updated_at),
        lastModified: formatDateToDayMonthYearHour(edgeService.updated_at),
        rawData: edgeService
      })) || []
    )
  },

  transformLoad(data) {
    return {
      id: data.id,
      name: data.name,
      active: data.active,
      code: convertVariablesToString(data.variables)
    }
  },

  transformPayload(payload) {
    return {
      active: payload.active,
      name: payload.name,
      variables: parseCodeToVariables(payload.code)
    }
  },

  transformResourcesList(data) {
    return (
      data?.map((resource) => ({
        id: resource.id,
        name: resource.name,
        trigger: resource.trigger,
        contentType: resource.content_type,
        lastEditor: resource.last_editor,
        lastModified: new Intl.DateTimeFormat('us', { dateStyle: 'full' }).format(
          new Date(resource.updated_at)
        ),
        lastModifiedDate: resource.updated_at
      })) || []
    )
  }
}
