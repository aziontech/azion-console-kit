<script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { useField } from 'vee-validate'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@aziontech/webkit/field-text'
  import FieldDropdown from '@aziontech/webkit/field-dropdown'
  import PickList from '@aziontech/webkit/picklist'
  import SelectButton from '@aziontech/webkit/selectbutton'
  import LabelBlock from '@aziontech/webkit/label'
  import PrimeButton from '@aziontech/webkit/button'
  import { useToast } from '@aziontech/webkit/use-toast'
  import { variablesService } from '@/services/v2/variables'
  import CodeEditor from '@/views/EdgeFunctions/components/code-editor.vue'
  import { useResize } from '@/composables/useResize'

  defineOptions({ name: 'form-fields-environment' })

  const props = defineProps({
    disabledFields: {
      type: Boolean,
      default: false
    },
    isEdit: {
      type: Boolean,
      default: false
    }
  })

  const toast = useToast()
  const { isMobile } = useResize()
  const { value: name } = useField('name')
  const { value: description } = useField('description')
  const { value: deploymentVersionPolicy } = useField('deployment_version_policy')
  const { value: globalVariables, errorMessage: globalVariablesError } = useField('globalVariables')
  const { value: environmentVariables, errorMessage: environmentVariablesError } =
    useField('environmentVariables')

  const deploymentVersionPolicyOptions = [
    { label: 'Single Version', value: 'single_version' },
    { label: 'Versioned URL', value: 'versioned_urls' }
  ]

  const isDeploymentVersionPolicyDisabled = computed(() => {
    return props.disabledFields || props.isEdit
  })

  const allGlobalVariables = ref([])
  const globalVariablesPickList = ref([[], []])
  const loadingGlobalVariables = ref(true)
  const pickListReady = ref(false)
  const envFileInputRef = ref(null)
  const customVariablesViewOptions = ['Form', 'JSON']
  const customVariablesView = ref(customVariablesViewOptions[0])
  const environmentVariablesJsonText = ref('{}')
  const customVariablesEntries = ref([])
  const environmentVariablesJsonError = ref('')
  const environmentVariablesFormError = ref('')
  const customVariablesFieldErrors = ref({})
  const isSyncingEnvironmentVariables = ref(false)
  const keyRegex = /^[A-Z0-9_]+$/
  let customVariableEntryId = 0

  const createCustomVariableEntry = (key = '', value = '') => ({
    id: `custom-variable-entry-${customVariableEntryId++}`,
    key,
    value
  })

  const hasEnvironmentVariablesError = computed(
    () =>
      !!environmentVariablesError.value ||
      !!environmentVariablesJsonError.value ||
      !!environmentVariablesFormError.value
  )

  const canAddCustomVariableEntry = computed(() => {
    if (customVariablesEntries.value.length === 0) return true

    const lastEntry = customVariablesEntries.value[customVariablesEntries.value.length - 1]
    const key = typeof lastEntry?.key === 'string' ? lastEntry.key.trim() : ''
    const value = typeof lastEntry?.value === 'string' ? lastEntry.value.trim() : ''

    return !!key && !!value
  })

  const normalizeEnvironmentVariablesObject = (value) => {
    if (!value) return {}

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}

        return Object.entries(parsed).reduce((acc, [key, itemValue]) => {
          if (!key?.trim()) return acc
          acc[key] = typeof itemValue === 'string' ? itemValue : String(itemValue ?? '')
          return acc
        }, {})
      } catch {
        return {}
      }
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
      return Object.entries(value).reduce((acc, [key, itemValue]) => {
        if (!key?.trim()) return acc
        acc[key] = typeof itemValue === 'string' ? itemValue : String(itemValue ?? '')
        return acc
      }, {})
    }

    return {}
  }

  const areEnvironmentVariablesEqual = (left, right) => {
    const leftKeys = Object.keys(left)
    const rightKeys = Object.keys(right)

    if (leftKeys.length !== rightKeys.length) return false

    return leftKeys.every((key) => right[key] === left[key])
  }

  const mapEnvironmentVariablesToEntries = (variables) => {
    return Object.entries(variables).map(([key, value]) => ({
      ...createCustomVariableEntry(key, value)
    }))
  }

  const getInvalidEnvironmentVariableKeys = (variablesObject) => {
    return Object.keys(variablesObject).filter((key) => !keyRegex.test(key.trim()))
  }

  const ensureCustomVariableEntry = () => {
    if (customVariablesEntries.value.length > 0) return

    customVariablesEntries.value = [createCustomVariableEntry()]
  }

  const mapEntriesToEnvironmentVariables = (entries) => {
    const nextVariables = {}
    const duplicatedKeys = new Set()
    const duplicatedKeyIndices = new Set()
    const emptyKeyIndices = new Set()
    const emptyValueIndices = new Set()
    const invalidKeyFormatIndices = new Set()
    const keyOccurrences = new Map()

    entries.forEach((entry, index) => {
      const key = typeof entry?.key === 'string' ? entry.key.trim() : ''
      const value = typeof entry?.value === 'string' ? entry.value : String(entry?.value ?? '')

      if (!key && !value) {
        return
      }

      if (!key) {
        emptyKeyIndices.add(index)
        return
      }

      if (!keyRegex.test(key)) {
        invalidKeyFormatIndices.add(index)
        return
      }

      if (!value.trim()) {
        emptyValueIndices.add(index)
        return
      }

      if (!keyOccurrences.has(key)) {
        keyOccurrences.set(key, [])
      }

      keyOccurrences.get(key).push(index)
      nextVariables[key] = value
    })

    keyOccurrences.forEach((indices, key) => {
      if (indices.length > 1) {
        duplicatedKeys.add(key)
        indices.forEach((index) => duplicatedKeyIndices.add(index))
      }
    })

    return {
      nextVariables,
      duplicatedKeys: Array.from(duplicatedKeys),
      duplicatedKeyIndices,
      emptyKeyIndices,
      emptyValueIndices,
      invalidKeyFormatIndices
    }
  }

  const setCustomVariablesFieldErrors = ({
    emptyKeyIndices,
    emptyValueIndices,
    invalidKeyFormatIndices,
    duplicatedKeyIndices,
    duplicatedKeys
  }) => {
    const nextErrors = {}

    // eslint-disable-next-line id-length
    customVariablesEntries.value.forEach((_, index) => {
      nextErrors[index] = { key: '', value: '' }

      if (emptyKeyIndices.has(index)) {
        nextErrors[index].key = 'Key is required.'
      } else if (invalidKeyFormatIndices.has(index)) {
        nextErrors[index].key = 'Invalid key format.'
      } else if (duplicatedKeyIndices.has(index)) {
        nextErrors[index].key = `Duplicated key: ${duplicatedKeys.join(', ')}`
      }

      if (emptyValueIndices.has(index)) {
        nextErrors[index].value = 'Value is required.'
      }
    })

    customVariablesFieldErrors.value = nextErrors
  }

  const getCustomVariableFieldError = (index, field) => {
    return customVariablesFieldErrors.value?.[index]?.[field] || ''
  }

  const syncEnvironmentVariablesViews = (source = 'external') => {
    const normalized = normalizeEnvironmentVariablesObject(environmentVariables.value)

    isSyncingEnvironmentVariables.value = true

    if (!areEnvironmentVariablesEqual(normalized, environmentVariables.value || {})) {
      environmentVariables.value = normalized
    }

    if (source !== 'json') {
      environmentVariablesJsonText.value = JSON.stringify(normalized, null, 2)
    }

    if (source !== 'form') {
      customVariablesEntries.value = mapEnvironmentVariablesToEntries(normalized)
      ensureCustomVariableEntry()
    }

    isSyncingEnvironmentVariables.value = false
  }

  const handleCustomVariablesJsonUpdate = (value) => {
    if (isSyncingEnvironmentVariables.value) return

    environmentVariablesJsonText.value = value

    if (!value?.trim()) {
      environmentVariablesJsonError.value = ''
      environmentVariablesFormError.value = ''
      environmentVariables.value = {}
      syncEnvironmentVariablesViews('json')
      return
    }

    try {
      const parsed = JSON.parse(value)

      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        environmentVariablesJsonError.value =
          'Environment Variables must be a JSON object with key/value pairs.'
        return
      }

      const normalized = normalizeEnvironmentVariablesObject(parsed)
      const invalidKeys = getInvalidEnvironmentVariableKeys(normalized)

      if (invalidKeys.length > 0) {
        environmentVariablesJsonError.value =
          'Invalid key format. Use only uppercase letters, numbers, and underscore (_).'
        return
      }

      environmentVariablesJsonError.value = ''
      environmentVariablesFormError.value = ''
      environmentVariables.value = normalized
      syncEnvironmentVariablesViews('json')
    } catch {
      environmentVariablesJsonError.value = 'Environment Variables must be valid JSON.'
    }
  }

  const handleEnvironmentVariablesFormChange = () => {
    if (isSyncingEnvironmentVariables.value) return

    const {
      nextVariables,
      duplicatedKeys,
      duplicatedKeyIndices,
      emptyKeyIndices,
      emptyValueIndices,
      invalidKeyFormatIndices
    } = mapEntriesToEnvironmentVariables(customVariablesEntries.value)
    const currentVariables = normalizeEnvironmentVariablesObject(environmentVariables.value)

    setCustomVariablesFieldErrors({
      emptyKeyIndices,
      emptyValueIndices,
      invalidKeyFormatIndices,
      duplicatedKeyIndices,
      duplicatedKeys
    })

    if (emptyKeyIndices.size > 0) {
      environmentVariablesFormError.value = 'Key is required.'
      if (environmentVariables.value !== null) {
        environmentVariables.value = null
      }
      return
    }

    if (emptyValueIndices.size > 0) {
      environmentVariablesFormError.value = 'Value is required.'
      if (environmentVariables.value !== null) {
        environmentVariables.value = null
      }
      return
    }

    if (invalidKeyFormatIndices.size > 0) {
      environmentVariablesFormError.value =
        'Invalid key format. Use only uppercase letters, numbers, and underscore (_).'
      if (environmentVariables.value !== null) {
        environmentVariables.value = null
      }
      return
    }

    if (duplicatedKeys.length > 0) {
      environmentVariablesFormError.value = `Duplicated key: ${duplicatedKeys.join(', ')}`
      if (environmentVariables.value !== null) {
        environmentVariables.value = null
      }
      return
    }

    environmentVariablesFormError.value = ''
    environmentVariablesJsonError.value = ''
    customVariablesFieldErrors.value = {}

    if (areEnvironmentVariablesEqual(currentVariables, nextVariables)) {
      return
    }

    environmentVariables.value = nextVariables
    syncEnvironmentVariablesViews('form')
  }

  const addCustomVariableEntry = () => {
    if (!canAddCustomVariableEntry.value) return

    customVariablesEntries.value = [...customVariablesEntries.value, createCustomVariableEntry()]
  }

  const updateCustomVariableEntry = (index, field, value) => {
    const nextEntries = [...customVariablesEntries.value]
    nextEntries[index] = {
      ...nextEntries[index],
      [field]: value
    }

    customVariablesEntries.value = nextEntries
  }

  const removeCustomVariableEntry = (index) => {
    customVariablesEntries.value = customVariablesEntries.value.filter(
      // eslint-disable-next-line id-length
      (_, itemIndex) => itemIndex !== index
    )
    ensureCustomVariableEntry()
    handleEnvironmentVariablesFormChange()
  }

  const areStringArraysEqual = (left, right) => {
    if (left.length !== right.length) return false

    const leftSet = new Set(left)
    return right.every((item) => leftSet.has(item))
  }

  const syncPickListFromFieldValue = () => {
    const selectedIds = new Set(Array.isArray(globalVariables.value) ? globalVariables.value : [])
    const selected = allGlobalVariables.value.filter((variable) => selectedIds.has(variable.id))
    const available = allGlobalVariables.value.filter((variable) => !selectedIds.has(variable.id))

    globalVariablesPickList.value = [available, selected]
  }

  const parseEnvFile = (content) => {
    const parsed = {}
    const invalidLines = []
    const lines = content.split(/\r?\n/)

    lines.forEach((line, index) => {
      const trimmedLine = line.trim()

      if (!trimmedLine || trimmedLine.startsWith('#')) {
        return
      }

      const normalizedLine = trimmedLine.startsWith('export ')
        ? trimmedLine.slice(7).trim()
        : trimmedLine

      const match = normalizedLine.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/)

      if (!match) {
        invalidLines.push(index + 1)
        return
      }

      const key = match[1]
      let value = match[2]

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }

      parsed[key] = value
    })

    return { parsed, invalidLines }
  }

  const fetchGlobalVariables = async () => {
    loadingGlobalVariables.value = true

    try {
      const response = await variablesService.list()
      const variables = Array.isArray(response?.body) ? response.body : []

      allGlobalVariables.value = variables.map((variable) => ({
        id: variable.id,
        key: variable.key
      }))

      syncPickListFromFieldValue()
    } catch {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load global variables',
        life: 5000
      })
    } finally {
      loadingGlobalVariables.value = false
      pickListReady.value = true
    }
  }

  const triggerEnvFileUpload = () => {
    if (props.disabledFields) return
    envFileInputRef.value?.click()
  }

  const handleEnvFileUpload = async (event) => {
    const file = event?.target?.files?.[0]

    if (!file) return

    const content = await file.text()
    const { parsed, invalidLines } = parseEnvFile(content)

    const hasAnyVariable = Object.keys(parsed).length > 0

    if (!hasAnyVariable && invalidLines.length > 0) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Unable to parse the selected file as .env format',
        life: 5000
      })
      event.target.value = ''
      return
    }

    environmentVariablesJsonError.value = ''
    environmentVariablesFormError.value = ''
    customVariablesFieldErrors.value = {}
    environmentVariables.value = normalizeEnvironmentVariablesObject(parsed)
    syncEnvironmentVariablesViews()

    if (invalidLines.length > 0) {
      toast.add({
        severity: 'warn',
        summary: 'Warning',
        detail: `Some lines were ignored: ${invalidLines.join(', ')}`,
        life: 6000
      })
    }

    event.target.value = ''
  }

  watch(
    globalVariables,
    () => {
      if (!pickListReady.value) return
      syncPickListFromFieldValue()
    },
    { deep: true }
  )

  watch(
    environmentVariables,
    () => {
      if (isSyncingEnvironmentVariables.value) return
      if (environmentVariablesJsonError.value || environmentVariablesFormError.value) return
      syncEnvironmentVariablesViews()
    },
    { deep: true, immediate: true }
  )

  watch(
    customVariablesEntries,
    () => {
      if (customVariablesView.value !== 'Form') return
      handleEnvironmentVariablesFormChange()
    },
    { deep: true }
  )

  watch(
    globalVariablesPickList,
    (newValue) => {
      if (!pickListReady.value) return

      const nextSelectedIds = (newValue?.[1] ?? []).map((item) => item.id)
      const currentSelectedIds = Array.isArray(globalVariables.value) ? globalVariables.value : []

      if (areStringArraysEqual(nextSelectedIds, currentSelectedIds)) {
        return
      }

      globalVariables.value = nextSelectedIds
    },
    { deep: true }
  )

  onMounted(async () => {
    ensureCustomVariableEntry()
    await fetchGlobalVariables()
  })
</script>

<template>
  <FormHorizontal
    title="General"
    description="Configure the identification and lifecycle status of the environment."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name"
          name="name"
          required
          placeholder="Production"
          description="Use a clear name to identify this deployment stage."
          :value="name"
          :disabled="props.disabledFields"
          data-testid="environment-form__name-field"
        />

        <FieldText
          label="Description"
          name="description"
          placeholder="Environment purpose and constraints"
          description="Optional description used for internal identification."
          :value="description"
          :disabled="props.disabledFields"
          data-testid="environment-form__description-field"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Settings"
    description="Define environment behavior and URL strategy."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldDropdown
          label="Deployment Version Policy"
          name="deployment_version_policy"
          required
          :options="deploymentVersionPolicyOptions"
          :value="deploymentVersionPolicy"
          optionLabel="label"
          optionValue="value"
          appendTo="self"
          description="Select how environment URLs are organized for deployments."
          :disabled="isDeploymentVersionPolicyDisabled"
          data-testid="environment-form__configuration-field"
        />

        <small
          v-if="props.isEdit"
          class="text-xs text-color-secondary font-normal leading-5"
        >
          Deployment Version Policy cannot be changed after the environment is created.
        </small>
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="Environment Variables"
    description="Select global variables already created in the platform for this environment."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-3xl w-full gap-2">
        <LabelBlock label="Global Variables" />

        <div
          v-if="loadingGlobalVariables"
          class="text-sm text-color-secondary"
        >
          Loading global variables...
        </div>

        <PickList
          v-else
          v-model="globalVariablesPickList"
          data-testid="environment-form__global-variables-picklist"
          dataKey="id"
          source-selection="multiple"
          target-selection="multiple"
          breakpoint="1400px"
          :showSourceControls="false"
          :showTargetControls="false"
          :disabled="props.disabledFields"
          :move-all-to-source-props="{
            'data-testid': 'environment-form__global-variables__move-all-to-source-btn'
          }"
          :move-all-to-target-props="{
            'data-testid': 'environment-form__global-variables__move-all-to-target-btn'
          }"
          :move-to-target-props="{
            'data-testid': 'environment-form__global-variables__move-to-target-btn'
          }"
          :move-to-source-props="{
            'data-testid': 'environment-form__global-variables__move-to-source-btn'
          }"
          :pt="{
            sourceList: {
              class: ['h-80'],
              'data-testid': 'environment-form__global-variables__source-list'
            },
            targetList: {
              class: ['h-80'],
              'data-testid': 'environment-form__global-variables__target-list'
            }
          }"
        >
          <template #sourceheader>Available Variables</template>
          <template #targetheader>Selected Variables</template>
          <template #item="slotProps">
            <span class="font-normal">{{ slotProps.item.key }}</span>
          </template>
        </PickList>

        <small class="text-xs text-color-secondary font-normal leading-5">
          Select one or more global variables to bind them to this environment.
        </small>

        <small
          v-if="globalVariablesError"
          class="p-error text-xs font-normal leading-tight"
        >
          {{ globalVariablesError }}
        </small>
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Custom Variables"
    description="Define environment-specific variables using the form or JSON editor, or import a .env file."
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-3">
        <div class="flex items-center gap-2 self-end">
          <PrimeButton
            label="Upload"
            icon="pi pi-upload"
            outlined
            size="small"
            :disabled="props.disabledFields"
            @click="triggerEnvFileUpload"
            data-testid="environment-form__upload-env-file-btn"
          />
          <input
            ref="envFileInputRef"
            type="file"
            class="hidden"
            :disabled="props.disabledFields"
            @change="handleEnvFileUpload"
          />
          <SelectButton
            v-model="customVariablesView"
            :options="customVariablesViewOptions"
            :disabled="props.disabledFields"
            aria-label="Custom variables view"
            class="flex h-9 p-1 w-fit"
            data-testid="environment-form__custom-variables-view-toggle"
          />
        </div>
        <template v-if="customVariablesView === 'Form'">
          <div class="flex flex-col gap-3">
            <div
              v-for="(item, index) in customVariablesEntries"
              :key="item.id"
              class="flex flex-col md:flex-row gap-2 md:items-start"
            >
              <FieldText
                :name="`customVariablesEntries.${index}.key`"
                :label="index === 0 || isMobile ? 'Key' : ''"
                :value="item.key"
                placeholder="VARIABLE_KEY_NAME"
                :additionalError="getCustomVariableFieldError(index, 'key')"
                :disabled="props.disabledFields"
                :data-testid="`environment-form__custom-variables__key-input-${index}`"
                @input="(value) => updateCustomVariableEntry(index, 'key', value)"
              />

              <div class="flex gap-2 w-full items-end">
                <FieldText
                  :name="`customVariablesEntries.${index}.value`"
                  :label="index === 0 || isMobile ? 'Value' : ''"
                  :value="item.value"
                  placeholder="VARIABLE_VALUE"
                  :additionalError="getCustomVariableFieldError(index, 'value')"
                  :disabled="props.disabledFields"
                  :data-testid="`environment-form__custom-variables__value-input-${index}`"
                  @input="(value) => updateCustomVariableEntry(index, 'value', value)"
                />

                <PrimeButton
                  v-if="customVariablesEntries.length > 1"
                  icon="pi pi-trash"
                  type="button"
                  outlined
                  severity="secondary"
                  size="small"
                  class="md:self-end"
                  :disabled="props.disabledFields"
                  @click="removeCustomVariableEntry(index)"
                  data-testid="environment-form__custom-variables__remove-row-btn"
                />
              </div>
            </div>
          </div>

          <div>
            <PrimeButton
              label="Add variable"
              icon="pi pi-plus"
              type="button"
              text
              size="small"
              :disabled="props.disabledFields || !canAddCustomVariableEntry"
              @click="addCustomVariableEntry"
              data-testid="environment-form__custom-variables__add-row-btn"
            />
          </div>
        </template>

        <template v-else>
          <CodeEditor
            :modelValue="environmentVariablesJsonText"
            runtime="json"
            :initialValue="environmentVariablesJsonText"
            :readOnly="props.disabledFields"
            :errors="hasEnvironmentVariablesError"
            :minimap="false"
            @update:modelValue="handleCustomVariablesJsonUpdate"
          />
        </template>

        <small
          v-if="customVariablesView !== 'Form'"
          class="text-xs text-color-secondary font-normal leading-5"
        >
          Use a JSON object format, for example: <code>{"API_URL":"https://example.com"}</code>
        </small>

        <small
          v-if="environmentVariablesJsonError"
          class="p-error text-xs font-normal leading-tight"
        >
          {{ environmentVariablesJsonError }}
        </small>

        <small
          v-if="environmentVariablesFormError"
          class="p-error text-xs font-normal leading-tight"
        >
          {{ environmentVariablesFormError }}
        </small>

        <small
          v-if="environmentVariablesError"
          class="p-error text-xs font-normal leading-tight"
        >
          {{ environmentVariablesError }}
        </small>
      </div>
    </template>
  </FormHorizontal>
</template>
