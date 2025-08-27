<script setup>
  import { computed, watch, nextTick, ref } from 'vue'
  import { useToast } from 'primevue/usetoast'
  import * as yup from 'yup'
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import EditDrawerBlock from '@templates/edit-drawer-block'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldNumber from '@/templates/form-fields-inputs/fieldNumber'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import Tag from 'primevue/tag'
  import InputText from 'primevue/inputtext'

  import { edgeSQLService } from '@/services/v2'
  import { useRoute } from 'vue-router'

  defineOptions({
    name: 'row-form-drawer'
  })

  const emit = defineEmits(['onSuccess', 'update:visible'])
  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    columns: {
      type: Array,
      default: () => []
    },
    columnInfo: {
      type: Array,
      default: () => []
    },
    tableName: {
      type: String,
      default: ''
    },
    initialData: {
      type: Object,
      default: () => ({})
    },
    isEditing: {
      type: Boolean,
      default: false
    },
    focusField: {
      type: String,
      default: ''
    }
  })

  const toast = useToast()
  const createDrawerRef = ref(null)
  const editDrawerRef = ref(null)
  const route = useRoute()
  const databaseId = computed(() => route.params.id)

  const validationSchema = computed(() => {
    const schemaShape = {}

    props.columnInfo.forEach((column) => {
      let fieldValidator

      switch (column.type.toUpperCase()) {
        case 'TEXT':
          fieldValidator = yup.string()
          break
        case 'INTEGER':
          fieldValidator = yup.number().integer(`Field '${column.name}' must be an integer.`)
          break
        case 'REAL':
        case 'NUMERIC':
          fieldValidator = yup.number()
          break
        case 'BOOLEAN':
          fieldValidator = yup.boolean()
          break
        default:
          fieldValidator = yup.mixed()
          break
      }

      if (column.notnull === 1) {
        fieldValidator = fieldValidator.required(`Field '${column.name}' is required.`)
      } else {
        fieldValidator = fieldValidator.nullable()
      }

      schemaShape[column.name] = fieldValidator
    })

    return yup.object().shape(schemaShape)
  })

  const initialValues = computed(() => {
    const values = {}
    props.columns.forEach((column) => {
      if (!isFieldBlobType(column)) {
        const value = props.initialData[column]
        values[column] = value !== undefined && value !== null ? String(value) : ''
      }
    })
    return values
  })

  const title = computed(() => {
    return props.isEditing ? 'Edit Row' : 'Insert New Row'
  })

  const editDrawerKey = computed(() => {
    if (!props.isEditing) return 'edit'
    const dataString = JSON.stringify(props.initialData)
    return `edit-${dataString.substring(0, 20)}-${Date.now().toString().slice(-6)}`
  })

  const realCreateService = async (formData) => {
    await edgeSQLService.insertRow(databaseId.value, {
      tableName: props.tableName,
      dataToInsert: formData,
      tableSchema: props.columnInfo
    })

    return {
      feedback: 'Row inserted successfully'
    }
  }

  const realEditService = async (formData) => {
    const originalData = props.initialData

    await edgeSQLService.updatedRow(databaseId.value, {
      tableName: props.tableName,
      newData: formData,
      whereData: originalData,
      tableSchema: props.columnInfo
    })

    return `Successfully updated.`
  }

  const realLoadService = async () => {
    await new Promise((resolve) => setTimeout(resolve, 200))

    const loadedData = {}
    props.columns.forEach((column) => {
      const value = props.initialData[column]
      loadedData[column] = value !== undefined && value !== null ? String(value) : ''
    })

    return loadedData
  }

  const handleSuccess = (response) => {
    emit('onSuccess', response)

    emit('update:visible', false)
  }

  const handleError = (error) => {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'An error occurred',
      life: 5000
    })
  }

  const getColumnInfo = (columnName) => {
    return props.columnInfo.find((col) => col[1] === columnName) || []
  }

  const getColumnType = (columnName) => {
    const info = getColumnInfo(columnName)
    return info[2] || null
  }

  const getColumnConstraints = (columnName) => {
    const info = getColumnInfo(columnName)
    const constraints = []

    if (info[3]) constraints.push({ value: 'NOT NULL', severity: 'warning' })
    if (info[5]) constraints.push({ value: 'PRIMARY KEY', severity: 'info' })
    if (info[4]) constraints.push({ value: 'DEFAULT', severity: 'secondary' })

    return constraints
  }

  const getEnhancedLabel = (columnName) => {
    const type = getColumnType(columnName)
    return type ? `${columnName} (${type})` : columnName
  }

  const getFieldDescription = (columnName) => {
    const info = getColumnInfo(columnName)
    if (!info.length) return `Enter ${columnName} value`

    let description = `Column: ${columnName}`
    if (info[4]) description += ` - Default: ${info[4]}`

    return description
  }

  const isSpecialType = (value) => {
    if (value !== null && value !== undefined && typeof value === 'object') {
      return true
    }
    return false
  }

  const formatSpecialTypeValue = (value) => {
    if (value === null) return 'NULL'
    if (value === undefined) return 'UNDEFINED'
    if (value === '') return '(empty)'

    if (value !== null && value !== undefined && typeof value === 'object') {
      if (value.type && value.data) {
        return `${value.type}(${value.data.length || 'unknown size'})`
      } else if (Array.isArray(value)) {
        return `Array[${value.length}]`
      } else if (value.constructor === Uint8Array || value.constructor === ArrayBuffer) {
        return `BLOB(${value.byteLength || value.length} bytes)`
      } else {
        const keys = Object.keys(value)
        const firstKey = keys[0]
        if (keys.length === 1 && typeof value[firstKey] === 'string') {
          const data = value[firstKey]

          if (data.length > 16 && /^[A-Za-z0-9+/=]+$/.test(data.substring(0, 20))) {
            return `BLOB(${Math.round(data.length * 0.75)} bytes, base64)`
          } else {
            return `Object{"${data.substring(0, 20)}${data.length > 20 ? '...' : ''}"}`
          }
        } else {
          return `Object{${keys.length} keys}`
        }
      }
    }

    return value
  }

  const isFieldBlobType = (columnName) => {
    const value = props.initialData[columnName]
    return isSpecialType(value)
  }

  watch(
    () => [props.visible, props.focusField],
    async ([newVisible, focusField]) => {
      if (newVisible && props.columns.length > 0) {
        await nextTick()

        setTimeout(() => {
          let targetField = null

          if (focusField) {
            const fieldIndex = props.columns.indexOf(focusField)
            if (fieldIndex >= 0) {
              targetField = document.querySelector(
                `[data-testid="row-form__field-${fieldIndex}"] input`
              )
            }
          }

          if (!targetField) {
            targetField = document.querySelector(`[data-testid="row-form__field-0"] input`)
          }

          if (targetField) {
            targetField.focus()

            if (targetField.tagName === 'INPUT' && targetField.type === 'text') {
              targetField.select()
            }
          }
        }, 500)
      }
    }
  )

  const getFieldComponent = (type) => {
    return ['INTEGER', 'REAL', 'NUMERIC'].includes(type) ? FieldNumber : FieldText
  }

  watch(
    () => props.initialData,
    () => {},
    { deep: true, immediate: true }
  )
</script>

<template>
  <CreateDrawerBlock
    v-if="!isEditing"
    ref="createDrawerRef"
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    :createService="realCreateService"
    :title="title"
    :schema="validationSchema"
    :initialValues="initialValues"
    @onSuccess="handleSuccess"
    @onError="handleError"
  >
    <template #formFields="{ disabledFields }">
      <FormHorizontal
        title="Row Data"
        description="Fill in the column values for this table row."
        :isDrawer="true"
      >
        <template #inputs>
          {{ columnInfo }}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <div
              v-for="(column, index) in columnInfo"
              :key="column"
              class="flex flex-col gap-2"
            >
              <div
                v-if="isFieldBlobType(column.name)"
                class="field"
              >
                <label class="text-sm font-medium text-color mb-2 block">
                  {{ getEnhancedLabel(column.name) }}
                </label>
                <InputText
                  :value="formatSpecialTypeValue(initialData[column.name])"
                  disabled
                  class="w-full font-mono text-sm"
                />
                <small class="text-color-secondary mt-2 block">
                  {{ getFieldDescription(column.name) }}
                </small>
                <div class="flex gap-1 flex-wrap mt-2">
                  <Tag
                    value="READONLY"
                    severity="warning"
                    class="text-xs"
                    style="font-size: 0.65rem; padding: 0.125rem 0.25rem"
                  />
                </div>
              </div>

              <template v-else>
                <component
                  :is="getFieldComponent(column.type)"
                  :label="getEnhancedLabel(column.name)"
                  :name="column.name"
                  :placeholder="`Enter ${column.name} value`"
                  :disabled="disabledFields"
                  :description="getFieldDescription(column.name)"
                  :data-testid="`row-form__field-${index}`"
                  :data-field="column.name"
                />
              </template>

              <div
                v-if="getColumnConstraints(column.name).length > 0"
                class="flex gap-1 flex-wrap mt-1"
              >
                <Tag
                  v-for="constraint in getColumnConstraints(column.name)"
                  :key="constraint.value"
                  :value="constraint.value"
                  :severity="constraint.severity"
                  class="text-xs"
                  style="font-size: 0.65rem; padding: 0.125rem 0.25rem"
                />
              </div>
            </div>
          </div>
        </template>
      </FormHorizontal>
    </template>
  </CreateDrawerBlock>

  <EditDrawerBlock
    v-else
    :key="editDrawerKey"
    id="edit-row"
    ref="editDrawerRef"
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    :loadService="realLoadService"
    :editService="realEditService"
    :title="title"
    :schema="validationSchema"
    @onSuccess="handleSuccess"
    @onError="handleError"
  >
    <template #formFields="{ disabledFields }">
      <FormHorizontal
        title="Row Data"
        description="Fill in the column values for this table row."
        :isDrawer="true"
      >
        <template #inputs>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <div
              v-for="(column, index) in columns"
              :key="column"
              class="flex flex-col gap-2"
            >
              <div
                v-if="isFieldBlobType(column)"
                class="field"
              >
                <label class="text-sm font-medium text-color mb-2 block">
                  {{ getEnhancedLabel(column) }}
                </label>
                <InputText
                  :value="formatSpecialTypeValue(initialData[column])"
                  disabled
                  class="w-full font-mono text-sm"
                />
                <small class="text-color-secondary mt-2 block">
                  {{ getFieldDescription(column) }}
                </small>
                <div class="flex gap-1 flex-wrap mt-2">
                  <Tag
                    value="READONLY"
                    severity="warning"
                    class="text-xs"
                    style="font-size: 0.65rem; padding: 0.125rem 0.25rem"
                  />
                </div>
              </div>

              <template v-else>
                <FieldText
                  :label="getEnhancedLabel(column)"
                  :name="column"
                  :placeholder="`Enter ${column} value`"
                  :disabled="disabledFields"
                  :description="getFieldDescription(column)"
                  :data-testid="`row-form__field-${index}`"
                  :data-field="column"
                />
              </template>

              <div
                v-if="getColumnConstraints(column).length > 0"
                class="flex gap-1 flex-wrap mt-1"
              >
                <Tag
                  v-for="constraint in getColumnConstraints(column)"
                  :key="constraint.value"
                  :value="constraint.value"
                  :severity="constraint.severity"
                  class="text-xs"
                  style="font-size: 0.65rem; padding: 0.125rem 0.25rem"
                />
              </div>
            </div>
          </div>
        </template>
      </FormHorizontal>
    </template>
  </EditDrawerBlock>
</template>
