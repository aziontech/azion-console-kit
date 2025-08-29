import { DefineComponent } from 'vue'

export interface DateRange {
  start: Date
  end: Date
}

export interface DataTimeRangeProps {
  modelValue?: DateRange
}

export interface DataTimeRangeEmits {
  'update:modelValue': [value: DateRange]
}

// Internal component interfaces
export interface QuickSelectProps {
  modelValue?: DateRange
}

export interface InputDateRangeProps {
  modelValue?: DateRange
}

export declare const DataTimeRange: DefineComponent<
  DataTimeRangeProps,
  {},
  {},
  {},
  {},
  {},
  {},
  DataTimeRangeEmits
>

export default DataTimeRange
