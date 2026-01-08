import { formatDateToDayMonthYearHour } from '@/helpers/convert-date'

export const NetworkListsAdapter = {
  transformListNetworkLists(data) {
    const listTypeMap = {
      ip_cidr: 'IP/CIDR',
      asn: 'ASN',
      countries: 'Countries'
    }
    return (
      data?.map((element) => ({
        id: element.id,
        stringId: element.id.toString(),
        name: element.name,
        lastEditor: element.last_editor,
        listType: listTypeMap[element.type],
        lastModify: formatDateToDayMonthYearHour(element.last_modified),
        lastModified: formatDateToDayMonthYearHour(element.last_modified)
      })) || []
    )
  },
  transformCreateNetworkList(payload) {
    return {
      name: payload.name,
      type: payload.networkListType,
      items: payload.networkContentList
    }
  },
  transformLoadNetworkList(response) {
    const { name, id, last_editor, type, items, last_modified } = response.data
    const isCountriesType = type === 'countries'

    return {
      name,
      id,
      stringId: id.toString(),
      lastEditor: last_editor,
      networkListType: type,
      itemsValuesCountry: isCountriesType ? items : [],
      itemsValues: isCountriesType ? '' : items.toString().replaceAll(',', '\n'),
      lastModified: new Intl.DateTimeFormat('us', { dateStyle: 'full', timeStyle: 'short' }).format(
        new Date(last_modified)
      )
    }
  },
  transformEditNetworkList(payload) {
    const { name, networkListType, itemsValues, itemsValuesCountry } = payload
    const isCountriesType = networkListType === 'countries'

    return {
      name,
      type: networkListType,
      items: isCountriesType ? itemsValuesCountry : itemsValues.trim().split('\n')
    }
  },
  transformLoadNetworkListToDropdown(body) {
    const element = body?.results

    const disabledIP = element.type === 'ip_cidr'
    const disabledCountries = element.type === 'countries'

    return {
      value: {
        id: element.id,
        disabledIP,
        disabledCountries
      },
      name: element.name
    }
  },
  transformListNetworkListToDropdown(data) {
    const isArray = Array.isArray(data)

    return isArray
      ? data?.map((element) => {
          const disabledIP = element.type === 'ip_cidr'
          const disabledCountries = element.type === 'countries'
          return {
            value: {
              id: element.id,
              disabledIP,
              disabledCountries
            },
            id: element.id,
            name: element.name
          }
        })
      : []
  }
}
