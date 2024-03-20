import { removeSelectedAmountOfHours } from '@/helpers/convert-date'
import { MountFilterTypes, ValidateFilters } from '../helpers'

const TSRANGE_CUSTOM_OPTION = 'custom'

function setTimeSeries({ tsRange, offset }) {
  if (offset === TSRANGE_CUSTOM_OPTION) {
    return tsRange
  }

  const date = new Date()
  const begin = removeSelectedAmountOfHours(offset, date)
  const end = removeSelectedAmountOfHours(0, date)

  const newTsRange = {
    begin: begin.toBeholderFormat(),
    end: end.toBeholderFormat(),
    meta: {
      option: offset
    }
  }

  return newTsRange
}

export default async (datasetAvailableFilters, filters) => {
  const mountedFilterWithTypes = MountFilterTypes(filters, datasetAvailableFilters)
  const { tsRange, and, datasets } = ValidateFilters(
    mountedFilterWithTypes,
    datasetAvailableFilters
  )
  if (!tsRange) return false

  const computedTsRange = setTimeSeries({
    tsRange,
    offset: tsRange.meta.option
  })

  const decodedFilter = {
    tsRange: computedTsRange
  }

  if (Object.keys(and).length) decodedFilter.and = and
  if (datasets.length) decodedFilter.datasets = datasets

  return decodedFilter
}
