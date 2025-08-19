# FilterFields Component

Component for advanced filtering with multiple conditions and logical operators.

## Props

- `modelValue` (Array|Object): Model value with filter rows or filter data object
- `filtersOptions` (Array): Array of available filter options with operators and field types

## Events

- `update:modelValue`: Emitted when the model value changes
- `apply-filter`: Emitted when filters are applied

## Slots

No slots available

## Usage Example

```vue
<template>
  <FilterFields 
    v-model="filters" 
    :filters-options="filterOptions"
    @apply-filter="handleFilterApply"
  />
</template>

<script setup>
import { ref } from 'vue'
import FilterFields from '@/components/base/filterFields'

const filters = ref([])
const filterOptions = ref([
  {
    label: 'Name',
    value: 'name',
    operator: [
      {
        props: { placeholder: 'Enter name' },
        type: 'String',
        value: 'Like'
      },
      {
        props: { placeholder: 'Enter name' },
        type: 'String',
        value: 'Eq'
      }
    ]
  },
  {
    label: 'Status',
    value: 'status',
    operator: [
      {
        props: { options: ['active', 'inactive'] },
        type: 'StringObject',
        value: 'Eq'
      }
    ]
  }
])

const handleFilterApply = (filterData) => {
  console.log('Applied filters:', filterData)
}
</script>
```

## Component Structure

- `index.vue`: Main component
- `filterPanel/index.vue`: Component for filter panel content and data processing
- `filterRow/index.vue`: Generic component for individual filter row

## Internal Components

The component uses internal subcomponents that are not exported publicly:
- `FilterPanel`: Manages the main filter panel content and processes filter options
- `FilterRow`: Generic component that manages individual filter rows (receives processed data)

## Filter Structure

Each filter row contains:
- `field`: Selected field label for filtering
- `fieldValue`: Selected field value for filtering
- `operator`: Comparison operator (Eq, Like, In, etc.)
- `operatorType`: Type of the operator (String, Boolean, etc.)
- `operatorFormat`: Format of the operator (=, like, in, etc.)
- `value`: Processed filter value
- `rawValue`: Raw filter value before processing
- `logicalOperator`: Logical operator (AND/OR) for combining filters

## Filter Options Structure

Each filter option should contain:
- `label`: Display label for the field
- `value`: Field identifier
- `description`: Optional description for the field
- `operator`: Array of available operators for this field
- `disabled`: Whether the field is disabled
- `networkListDisabled`: Whether network list is disabled for this field
- `mostRelevant`: Relevance score for sorting

## Data Processing

The component automatically processes the filter options:
1. **FilterPanel**: Processes `filtersOptions` into `processedFields` using `OPERATOR_MAPPING`
2. **FilterRow**: Receives the processed data and renders the interface
3. **Generic Design**: `FilterRow` is now generic and can be reused with any processed field data
