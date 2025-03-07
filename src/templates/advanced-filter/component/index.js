import { h } from 'vue'
import multiselectFilter from './fields/multiselect-filter'
import selectFilter from './fields/select-filter'
import textFilter from './fields/text-filter'
import numberFilter from './fields/number-filter'
import floatFilter from './fields/float-filter'
import chipsFilter from './fields/chips-filter'
import floatRangeFilter from './fields/float-range-filter'
import numberRangeFilter from './fields/number-range-filter'
import MultiSelectLazyLoaderFilter from './fields/multiselect-lazy-loader-filter.vue'

export const FIELDS_MAPPING = {
  Int: h(numberFilter),
  Float: h(floatFilter),
  String: h(textFilter),
  IntRange: h(numberRangeFilter),
  FloatRange: h(floatRangeFilter),
  ArrayObject: h(multiselectFilter),
  ArrayObjectDomain: h(MultiSelectLazyLoaderFilter),
  Boolean: h(selectFilter),
  StringObject: h(selectFilter),
  ArrayString: h(chipsFilter),
  GenericScalar: h(textFilter)
}

export const OPERATOR_MAPPING = {
  In: { value: 'In', label: 'In', format: 'in' },
  Eq: { value: 'Eq', label: 'Equals', format: '=' },
  Ne: { value: 'Ne', label: 'Not Equals', format: '≠' },
  Like: { value: 'Like', label: 'Contains', format: '⊃' },
  Ilike: { value: 'Ilike', label: 'Not Contains', format: '⊅' },
  Range: { value: 'Range', label: 'Between', format: '≤' },
  Lt: { value: 'Lt', label: 'Less Than', format: '<' },
  Lte: { value: 'Lte', label: 'Less Than or Equal', format: '≤' },
  Gt: { value: 'Gt', label: 'Greater Than', format: '>' },
  Gte: { value: 'Gte', label: 'Greater Than or Equal', format: '≥' }
}

export const OPERATOR_MAPPING_ADVANCED_FILTER = {
  In: { value: 'In', label: 'In', format: 'in' },
  Eq: { value: 'Eq', label: 'Equals', format: '=' },
  Ne: { value: 'Ne', label: 'Not Equals', format: '<>' },
  Like: { value: 'Like', label: 'Contains', format: 'like' },
  Ilike: { value: 'Ilike', label: 'Not Contains', format: 'ilike' },
  Range: { value: 'Range', label: 'Between', format: 'between' },
  Lt: { value: 'Lt', label: 'Less Than', format: '<' },
  Lte: { value: 'Lte', label: 'Less Than or Equal', format: '<=' },
  Gt: { value: 'Gt', label: 'Greater Than', format: '>' },
  Gte: { value: 'Gte', label: 'Greater Than or Equal', format: '≥' }
}
