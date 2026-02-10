---
name: create-jsonform-custom-render
description: How to create a new JSONForms custom renderer
---

# Creating a JSONForms Custom Renderer

This skill describes how to create a new custom renderer for JSONForms in the Azion Console Kit.

## Overview

JSONForms custom renderers allow you to use the existing form field components from `src/templates/form-fields-inputs/` within JSONForms schemas. Each custom renderer consists of two files:

1. **Renderer Component** (`*ControlRenderer.vue`) - The Vue component that wraps the field input
2. **Tester Function** (`*ControlTester.js`) - Determines when this renderer should be used

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        JSONForms Core                           │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │   Schema    │───▶│   Tester    │───▶│  Custom Renderer    │  │
│  │  (JSON)     │    │  (rankWith) │    │  (Vue Component)    │  │
│  └─────────────┘    └─────────────┘    └──────────┬──────────┘  │
└───────────────────────────────────────────────────│─────────────┘
                                                    │
                                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Field Input Component                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  fieldText.vue / fieldDropdown.vue / fieldNumber.vue    │    │
│  │  (from src/templates/form-fields-inputs/)               │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## File Structure

```
src/templates/form-fields-inputs/jsonform-custom-render/
├── input-text/
│   ├── inputTextControlRenderer.vue
│   └── inputTextControlTester.js
├── input-number/
│   ├── inputNumberControlRenderer.vue
│   └── inputNumberControlTester.js
├── input-password/
│   ├── inputPasswordControlRenderer.vue
│   └── inputPasswordControlTester.js
├── textarea/
│   ├── textareaControlRenderer.vue
│   └── textareaControlTester.js
├── dropdown/
│   ├── dropdownControlRenderer.vue
│   └── dropdownControlTester.js
└── [your-new-renderer]/
    ├── [name]ControlRenderer.vue
    └── [name]ControlTester.js
```

## Step-by-Step Guide

### Step 1: Create the Folder

Create a new folder inside `src/templates/form-fields-inputs/jsonform-custom-render/` with a descriptive name (e.g., `dropdown`, `switch`, `checkbox`).

### Step 2: Create the Tester File

The tester determines when your custom renderer should be used. It uses `rankWith` from `@jsonforms/core`.

**Basic Tester Pattern:**

```javascript
import { rankWith, isStringControl, or, and, schemaMatches } from '@jsonforms/core'

export const YourControlTester = rankWith(
  PRIORITY_NUMBER,  // Higher number = higher priority
  CONDITION          // When to use this renderer
)
```

**Common Conditions:**

| Condition | Use Case |
|-----------|----------|
| `isStringControl` | String type fields |
| `isNumberControl` | Number type fields |
| `isIntegerControl` | Integer type fields |
| `isBooleanControl` | Boolean type fields |
| `isEnumControl` | Enum (dropdown) fields |
| `isMultiLineControl` | Multi-line text fields |

**Combining Conditions:**

```javascript
// Match multiple types
or(isNumberControl, isIntegerControl)

// Match type + custom schema property
and(
  isStringControl,
  schemaMatches((schema) => schema.format === 'password')
)

// Match custom schema option
and(
  isStringControl,
  schemaMatches((schema) => schema.options?.multi)
)
```

**Priority Guidelines:**
- `1-5`: Generic fallback renderers
- `10-20`: Specific format/option renderers
- Higher priority wins when multiple testers match

**Examples from existing renderers:**

```javascript
// input-text: Basic string control (priority 2)
export const InputTextControlTester = rankWith(2, or(isStringControl))

// input-number: Number or integer (priority 2)
export const InputNumberControlTester = rankWith(2, or(isNumberControl, isIntegerControl))

// input-password: String with format="password" (priority 15)
export const InputPasswordControlTester = rankWith(
  15,
  and(
    isStringControl,
    schemaMatches((schema) => schema.format === 'password')
  )
)

// textarea: String with options.multi=true (priority 3)
export const TextareaControlTester = rankWith(
  3,
  and(
    isStringControl,
    schemaMatches((schema) => schema.options?.multi)
  )
)
```

### Step 3: Create the Renderer Component

The renderer component wraps your field input and connects it to JSONForms.

**Template Structure:**

```vue
<script setup>
  import { computed, ref } from 'vue'
  import { useJsonFormsControl, rendererProps } from '@jsonforms/vue'
  import YourFieldComponent from '@/templates/form-fields-inputs/fieldYourComponent.vue'

  const emit = defineEmits(['change', 'blur'])
  const props = defineProps(rendererProps())

  // Get control state and change handler from JSONForms
  const { control, handleChange } = useJsonFormsControl(props)
  
  // Track if field has been modified (for error display)
  const isChanged = ref(false)

  // Extract values from control object
  const description = computed(() => control.value.description)
  const label = computed(() => control.value.schema.label)
  const path = computed(() => control.value.path)
  const required = computed(() => control.value.required)
  const error = computed(() => (control.value.errors ? control.value.schema.error : ''))
  const errorMessage = computed(() => (!error.value || !isChanged.value ? '' : error.value))

  // Additional schema properties (component-specific)
  // const customProp = computed(() => control.value.schema.customProp)
  // const options = computed(() => control.value.schema.options)

  const onChange = (value) => {
    isChanged.value = true
    handleChange(path.value, value)
    emit('change', value)
  }

  const onBlur = (event) => {
    const value = event.target?.value
    handleChange(path.value, value)
    emit('blur', value)
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <YourFieldComponent
      :name="path"
      :label="label"
      :description="description"
      :required="required"
      :aditionalError="errorMessage"
      @blur="onBlur"
      @input="onChange"
    />
  </div>
</template>
```

### Step 4: Map Schema Properties to Component Props

The `control.value` object contains:

| Property | Description |
|----------|-------------|
| `control.value.path` | Field path/name in the form |
| `control.value.schema` | The JSON Schema for this field |
| `control.value.description` | Field description |
| `control.value.required` | Whether field is required |
| `control.value.errors` | Validation errors |

Access custom schema properties via `control.value.schema.*`:

```javascript
// For schema: { type: "number", minimum: 0, maximum: 100, multipleOf: 5 }
const min = computed(() => control.value.schema.minimum)
const max = computed(() => control.value.schema.maximum)
const step = computed(() => control.value.schema.multipleOf || 1)

// For schema: { type: "string", options: { rows: 10, multi: true } }
const rows = computed(() => control.value.schema.options?.rows || 5)
```

## Error Handling with `aditionalError`

The `aditionalError` prop is a critical pattern for passing JSONForms validation errors to field components. This prop allows external error messages (from JSONForms) to be displayed alongside or instead of vee-validate's internal validation.

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    JSONForms Validation                         │
│  control.value.errors ──▶ control.value.schema.error            │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Custom Renderer                              │
│  const error = computed(() =>                                   │
│    control.value.errors ? control.value.schema.error : ''       │
│  )                                                              │
│  const errorMessage = computed(() =>                            │
│    !error.value || !isChanged.value ? '' : error.value          │
│  )                                                              │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Field Component                              │
│  :aditionalError="errorMessage"                                 │
│                                                                 │
│  Shows: aditionalError || veeValidateErrorMessage               │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation Pattern

**In the Renderer Component:**

```javascript
// Track if field has been modified (prevents showing errors on pristine fields)
const isChanged = ref(false)

// Get error from schema (custom error message defined in JSON schema)
const error = computed(() => (control.value.errors ? control.value.schema.error : ''))

// Only show error after user interaction
const errorMessage = computed(() => (!error.value || !isChanged.value ? '' : error.value))

const onChange = (value) => {
  isChanged.value = true  // Mark as changed on first interaction
  handleChange(path.value, value)
  emit('change', value)
}
```

**In the Template:**

```vue
<YourFieldComponent
  :aditionalError="errorMessage"
  @input="onChange"
/>
```

### Schema Error Configuration

Define custom error messages in your JSON schema:

```json
{
  "az_name": {
    "type": "string",
    "label": "Application Name",
    "pattern": "^[A-Za-z][A-Za-z0-9_]*$",
    "error": "Name must start with a letter and contain only letters, numbers, and underscores."
  }
}
```

### Components Supporting `aditionalError`

| Component | Supports `aditionalError` |
|-----------|:-------------------------:|
| `fieldText.vue` | ✅ |
| `fieldNumber.vue` | ✅ |
| `fieldTextPassword.vue` | ✅ |
| `fieldTextArea.vue` | ✅ |
| `fieldDropdown.vue` | ✅ |
| `fieldSwitch.vue` | ❌ |
| `fieldSwitchBlock.vue` | ❌ |
| `fieldGroupRadio.vue` | ❌ (uses internal errorMessage) |
| `fieldGroupCheckbox.vue` | ❌ |
| `fieldMultiSelect.vue` | ❌ (uses internal errorMessage) |
| `fieldAutoComplete.vue` | ❌ (uses internal errorMessage) |

> **Note:** If a component doesn't support `aditionalError`, you can display the error manually in the renderer template using a `<small>` element.

## Available Field Components

Use these components from `src/templates/form-fields-inputs/`:

| Component | Use Case | Key Props |
|-----------|----------|-----------|
| `fieldText.vue` | Text input | `name`, `label`, `description`, `placeholder`, `disabled`, `readonly`, `aditionalError` |
| `fieldNumber.vue` | Number input | `name`, `label`, `min`, `max`, `step`, `showButtons`, `useGrouping`, `aditionalError` |
| `fieldTextPassword.vue` | Password input | `name`, `label`, `description`, `aditionalError` |
| `fieldTextArea.vue` | Multi-line text | `name`, `label`, `rows`, `cols`, `autoResize`, `aditionalError` |
| `fieldDropdown.vue` | Static dropdown | `name`, `label`, `options`, `optionLabel`, `optionValue`, `placeholder`, `aditionalError` |
| `fieldSwitch.vue` | Toggle switch | `name`, `label`, `description` |
| `fieldSwitchBlock.vue` | Switch with card | `name`, `nameField`, `title`, `subtitle`, `description`, `isCard` |
| `fieldGroupRadio.vue` | Radio group | `nameField`, `label`, `options`, `isCard` |
| `fieldGroupCheckbox.vue` | Checkbox group | `label`, `options`, `isCard` |
| `fieldMultiSelect.vue` | Multi-select checkboxes | `name`, `label`, `options`, `optionLabel`, `optionValue` |
| `fieldAutoComplete.vue` | Autocomplete | `name`, `label`, `suggestions`, `onComplete` |

## Example: Creating a Dropdown Renderer

### 1. Create the Tester

`src/templates/form-fields-inputs/jsonform-custom-render/dropdown/dropdownControlTester.js`:

```javascript
import { rankWith, isEnumControl } from '@jsonforms/core'
export const DropdownControlTester = rankWith(3, isEnumControl)
```

### 2. Create the Renderer

`src/templates/form-fields-inputs/jsonform-custom-render/dropdown/dropdownControlRenderer.vue`:

```vue
<script setup>
  import { computed, ref } from 'vue'
  import { useJsonFormsControl, rendererProps } from '@jsonforms/vue'
  import fieldDropdown from '@/templates/form-fields-inputs/fieldDropdown.vue'

  const emit = defineEmits(['change', 'blur'])
  const props = defineProps(rendererProps())

  const { control, handleChange } = useJsonFormsControl(props)
  const isChanged = ref(false)

  // Core properties
  const description = computed(() => control.value.description)
  const label = computed(() => control.value.schema.label)
  const path = computed(() => control.value.path)
  const required = computed(() => control.value.required)
  
  // Error handling with aditionalError pattern
  const error = computed(() => (control.value.errors ? control.value.schema.error : ''))
  const errorMessage = computed(() => (!error.value || !isChanged.value ? '' : error.value))

  // Dropdown-specific properties
  const placeholder = computed(() => control.value.schema.placeholder || '')
  const disabled = computed(() => control.value.schema.disabled || false)
  const filter = computed(() => control.value.schema.filter || false)
  const loading = computed(() => control.value.schema.loading || false)

  // Convert enum/enumLabels to options format
  const options = computed(() => {
    // Support options.items format
    if (control.value.schema.options?.items) {
      return control.value.schema.options.items
    }

    // Support enum/enumLabels format
    const enumValues = control.value.schema.enum || []
    const enumLabels = control.value.schema.enumLabels || enumValues
    return enumValues.map((value, index) => ({
      label: enumLabels[index] || value,
      value: value
    }))
  })

  const optionLabel = computed(() => control.value.schema.optionLabel || 'label')
  const optionValue = computed(() => control.value.schema.optionValue || 'value')

  const onChange = (value) => {
    isChanged.value = true
    handleChange(path.value, value)
    emit('change', value)
  }

  const onBlur = () => {
    emit('blur')
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <fieldDropdown
      :name="path"
      :label="label"
      :description="description"
      :required="required"
      :options="options"
      :optionLabel="optionLabel"
      :optionValue="optionValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :filter="filter"
      :loading="loading"
      :aditionalError="errorMessage"
      @onChange="onChange"
      @onBlur="onBlur"
    />
  </div>
</template>
```

### 3. Example Schema

```json
{
  "az_region": {
    "type": "string",
    "label": "Region",
    "description": "Select the region for deployment.",
    "placeholder": "Select a region",
    "enum": ["us-east", "us-west", "eu-west", "ap-south"],
    "enumLabels": ["US East", "US West", "EU West", "Asia Pacific South"],
    "error": "Please select a valid region.",
    "instantiation_data_path": "envs.[0].value"
  }
}
```

## Registering the Renderer

After creating your renderer, register it in your JSONForms configuration:

```javascript
import DropdownControlRenderer from './jsonform-custom-render/dropdown/dropdownControlRenderer.vue'
import { DropdownControlTester } from './jsonform-custom-render/dropdown/dropdownControlTester.js'

const renderers = [
  // ... other renderers
  { tester: DropdownControlTester, renderer: DropdownControlRenderer }
]
```

## Best Practices

### 1. Error Handling
- Always use the `isChanged` pattern to prevent showing errors on pristine fields
- Pass errors via `aditionalError` prop when the component supports it
- For components without `aditionalError`, render error manually in template

### 2. Component Structure
- Wrap fields in `<div class="flex flex-col gap-2">` for consistent spacing
- Use computed properties for all schema-derived values
- Keep the template clean and delegate logic to script

### 3. Tester Priority
- `1-5`: Generic fallback renderers (e.g., basic string, number)
- `10-20`: Specific format/option renderers (e.g., password, textarea)
- Higher priority wins when multiple testers match

### 4. Schema Design
- Document all custom schema properties your renderer expects
- Provide sensible defaults for optional properties
- Use `error` property for custom validation messages

### 5. Events
- Always emit `change` and `blur` events for proper form integration
- Mark `isChanged = true` in `onChange` handler

### 6. Naming Conventions
- Folder: lowercase, descriptive (e.g., `dropdown`, `input-text`)
- Tester: `[Name]ControlTester` exported as named export
- Renderer: `[name]ControlRenderer.vue` as default export

## Troubleshooting

### Renderer Not Being Used
1. Check tester priority - higher priority wins
2. Verify the condition matches your schema
3. Ensure renderer is registered in the renderers array

### Errors Not Displaying
1. Verify `isChanged` is being set to `true` on change
2. Check that `control.value.errors` is truthy when validation fails
3. Ensure `error` property is defined in schema
4. Confirm component supports `aditionalError` prop

### Value Not Updating
1. Verify `handleChange(path.value, value)` is called
2. Check that `path` computed property is correct
3. Ensure event handlers are properly bound in template
