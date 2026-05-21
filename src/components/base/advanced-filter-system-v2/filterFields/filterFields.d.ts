import { DefineComponent } from 'vue'

export interface FilterOption {
  label: string
  value: string
  description?: string
  operator: Array<{
    props?: any
    placeholder?: string
    type: string
    value: string
    disabled?: boolean
  }>
  disabled?: boolean
  networkListDisabled?: boolean
  mostRelevant?: number
}

export interface FilterRow {
  id: number
  field: string | null
  fieldValue: string | null
  operator: string | null
  operatorType?: string
  operatorFormat?: string
  value: any
  rawValue?: any
  logicalOperator: 'AND' | 'OR'
}

export interface FilterData {
  filters: FilterRow[]
  customLabel?: string
}

export interface FilterFieldsProps {
  modelValue?: FilterRow[] | FilterData
  filtersOptions: FilterOption[]
}

export interface FilterFieldsEmits {
  'update:modelValue': [value: FilterRow[] | FilterData]
  'apply-filter': [value: FilterData]
}

// Internal component interfaces
export interface FilterRowData {
  id: number
  field: string | null
  fieldValue: string | null
  operator: string | null
  operatorType?: string
  operatorFormat?: string
  value: any
  rawValue?: any
  logicalOperator: 'AND' | 'OR'
}

export interface ProcessedField {
  label: string
  mostRelevant: number
  value: {
    disabled?: boolean
    networkListDisabled?: boolean
    description?: string
    value: string
    label: string
    operator: Array<{
      label: string
      value: {
        disabled?: boolean
        placeholder?: string
        value: string
        props?: any
        format: string
        type: string
      }
    }>
  }
}

export interface Operator {
  value: string
  label: string
}

export declare const FilterFields: DefineComponent<
  FilterFieldsProps,
  {},
  {},
  {},
  {},
  {},
  {},
  FilterFieldsEmits
>

export default FilterFields
