import { h } from 'vue'
import multiselectFilter from './fields/multiselect-filter'
import selectFilter from './fields/select-filter'
import textFilter from './fields/text-filter'
import numberFilter from './fields/number-filter'
import floatFilter from './fields/float-filter'
import chipsFilter from './fields/chips-filter'
import floatRangeFilter from './fields/float-range-filter'
import numberRangeFilter from './fields/number-range-filter'

export const FIELDS_MAPPING = {
  Int: h(numberFilter),
  Float: h(floatFilter),
  String: h(textFilter),
  IntRange: h(numberRangeFilter),
  FloatRange: h(floatRangeFilter),
  ArrayObject: h(multiselectFilter),
  Boolean: h(selectFilter),
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
