<template>
  <FieldText
    :fieldname="fieldName"
    :label="computedLabel"
    :value="control.data || ''"
    :placeholder="computedPlaceholder"
    :description="computedDescription"
    :type="inputType"
    :required="computedRequired"
    :disabled="!control.enabled"
    :readonly="computedReadonly"
    :rules="validationRules"
    @change="onChange"
    @input="onChange"
    @blur="onChange"
  />
</template>

<script setup>
  import { computed } from 'vue'
  import { useJsonFormsControl, rendererProps } from '@jsonforms/vue'
  import FieldText from '@/templates/form-fields-inputs/fieldText.vue'

  const props = defineProps(rendererProps())

  const { control, handleChange } = useJsonFormsControl(props)

  // Computed properties for FieldText props
  const computedLabel = computed(() => {
    return control.label || control.schema?.title || ''
  })

  const computedPlaceholder = computed(() => {
    return control.schema?.description || ''
  })

  const computedDescription = computed(() => {
    return control.schema?.description || ''
  })

  const computedRequired = computed(() => {
    return control.required || false
  })

  const computedReadonly = computed(() => {
    return control.schema?.readOnly || false
  })

  const fieldName = computed(() => {
    if (!control.path) return 'textInput'

    // Convert JsonForms path (/cookie_name) to valid field name (cookie_name)
    return control.path.replace(/^\/+/, '').replace(/\//g, '_') || 'textInput'
  })

  // Determine input type based on schema format or type
  const inputType = computed(() => {
    const format = control.schema?.format
    const type = control.schema?.type

    if (format) {
      const formatMap = {
        email: 'email',
        password: 'password',
        uri: 'url',
        tel: 'tel'
      }
      return formatMap[format] || 'text'
    }

    if (type === 'number' || type === 'integer') {
      return 'number'
    }

    return 'text'
  })

  // Validation rules based on schema
  const validationRules = computed(() => {
    const rules = []
    const schema = control.schema

    if (computedRequired.value) {
      rules.push('required')
    }

    if (schema?.minLength) {
      rules.push(`min:${schema.minLength}`)
    }

    if (schema?.maxLength) {
      rules.push(`max:${schema.maxLength}`)
    }

    if (schema?.pattern) {
      rules.push(`regex:${schema.pattern}`)
    }

    if (schema?.format === 'email') {
      rules.push('email')
    }

    if (schema?.type === 'number' || schema?.type === 'integer') {
      if (schema?.minimum !== undefined) {
        rules.push(`min_value:${schema.minimum}`)
      }
      if (schema?.maximum !== undefined) {
        rules.push(`max_value:${schema.maximum}`)
      }
    }

    return rules.join('|')
  })

  const onChange = (value) => {
    if (handleChange && control.path) {
      // Convert value based on schema type
      let convertedValue = value

      if (control.schema?.type === 'number') {
        convertedValue = value === '' ? null : parseFloat(value)
      } else if (control.schema?.type === 'integer') {
        convertedValue = value === '' ? null : parseInt(value, 10)
      }

      handleChange(control.path, convertedValue)
    }
  }
</script>
