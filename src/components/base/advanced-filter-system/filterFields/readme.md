# FilterFields Component

Component for advanced filtering with multiple conditions and logical operators in a flat, linear structure.

## Features

- **Flat Structure**: Simple linear filter rows with AND/OR connections
- **Dynamic Rules**: Add/remove rules dynamically with AND/OR buttons
- **Multiple Operators**: Support for Eq, In, Like, Ilike, Range, Gt, Lt, Gte, Lte, Ne
- **Real-time Preview**: JSON structure preview and validation

## Props

- `modelValue` (Array|Object): Model value with filter rows or filter data object
- `filtersOptions` (Array): Array of available filter options with operators and field types

## Events

- `update:modelValue`: Emitted when the model value changes
- `apply-filter`: Emitted when filters are applied
- `cancel`: Emitted when filter operation is cancelled

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

### Simple Rule

```javascript
{
  field: "name",
  operator: "Eq",
  value: "John"
}
```

### Multiple Rules with AND/OR

```javascript
{
  condition: "AND",
  rules: [
    { field: "age", operator: "Gt", value: 18 },
    { field: "status", operator: "Eq", value: "active" },
    { field: "city", operator: "In", value: ["Rio", "São Paulo"] }
  ]
}
```

## Button Behaviors

### Add OR Button

- **Function**: `addRule('OR')`
- **Behavior**: Adds a new rule connected with OR operator
- **Location**: Right side of each filter row

### Add AND Button

- **Function**: `addRule('AND')`
- **Behavior**: Adds a new rule connected with AND operator
- **Location**: Right side of each filter row

### Remove Button (Trash Icon)

- **Function**: `removeRule(index)`
- **Behavior**: Removes the current filter row
- **Location**: Far right of each filter row

## Supported Operators

| Operator | Description           | Format  |
| -------- | --------------------- | ------- |
| Eq       | Equals                | =       |
| Ne       | Not Equals            | !=      |
| Like     | Contains              | LIKE    |
| Ilike    | Not Contains          | ILIKE   |
| In       | In list               | IN      |
| Range    | Between               | BETWEEN |
| Gt       | Greater Than          | >       |
| Lt       | Less Than             | <       |
| Gte      | Greater Than or Equal | >=      |
| Lte      | Less Than or Equal    | <=      |

## Field Types

| Type         | Component    | Description                 |
| ------------ | ------------ | --------------------------- |
| String       | Text Input   | Simple text input           |
| Int          | Number Input | Integer input               |
| Float        | Float Input  | Decimal number input        |
| IntRange     | Number Range | Integer range input         |
| FloatRange   | Float Range  | Decimal range input         |
| ArrayObject  | MultiSelect  | Multiple selection dropdown |
| Boolean      | Select       | Boolean dropdown            |
| StringObject | Select       | Single selection dropdown   |
| ArrayString  | Chips        | Multiple text values        |

## Validation

The component provides real-time validation:

- Required fields validation
- Operator-specific validation
- Value format validation

## Example Output

```javascript
{
  "condition": "AND",
  "rules": [
    {
      "field": "age",
      "operator": "Gt",
      "value": 18
    },
    {
      "field": "status",
      "operator": "Eq",
      "value": "active"
    },
    {
      "field": "city",
      "operator": "In",
      "value": ["Rio", "São Paulo"]
    }
  ]
}
```
