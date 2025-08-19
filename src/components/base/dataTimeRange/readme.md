# DataTimeRange Component

Component for date range selection with quick options and manual input.

## Props

- `modelValue` (Object): Model value with `start` and `end` properties (Date)

## Events

- `update:modelValue`: Emitted when the model value changes

## Slots

No slots available

## Usage Example

```vue
<template>
  <DataTimeRange v-model="dateRange" />
</template>

<script setup>
import { ref } from 'vue'
import DataTimeRange from '@/components/base/dataTimeRange'

const dateRange = ref({
  start: new Date(),
  end: new Date()
})
</script>
```

## Component Structure

- `index.vue`: Main component
- `quickSelect/index.vue`: Component for quick range selection
- `inputDateRange/index.vue`: Component for manual date input

## Internal Components

The component uses internal subcomponents that are not exported publicly:
- `QuickSelect`: Manages quick date range selection with common options
- `InputDateRange`: Manages manual date range input with date pickers
