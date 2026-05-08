<script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { useField } from 'vee-validate'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@aziontech/webkit/field-text'
  import FieldDropdown from '@aziontech/webkit/field-dropdown'
  import PickList from '@aziontech/webkit/picklist'
  import LabelBlock from '@aziontech/webkit/label'
  import PrimeButton from '@aziontech/webkit/button'
  import { useToast } from '@aziontech/webkit/use-toast'
  import { variablesService } from '@/services/v2/variables'
  import CodeEditor from '@/views/EdgeFunctions/components/code-editor.vue'

  defineOptions({ name: 'form-fields-environment' })

  const props = defineProps({
    disabledFields: {
      type: Boolean,
      default: false
    }
  })

  const toast = useToast()

  const { value: name } = useField('name')
  const { value: status } = useField('status')
  const { value: configuration } = useField('configuration')
  const { value: globalVariables, errorMessage: globalVariablesError } = useField('globalVariables')
  const { value: environmentVariables, errorMessage: environmentVariablesError } =
    useField('environmentVariables')

  const statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' }
  ]

  const configurationOptions = [
    { label: 'Single Version', value: 'single_version' },
    { label: 'Versioned URLs', value: 'versioned_urls' }
  ]

  const allGlobalVariables = ref([])
  const globalVariablesPickList = ref([[], []])
  const loadingGlobalVariables = ref(true)
  const pickListReady = ref(false)
  const envFileInputRef = ref(null)

  const hasEnvironmentVariablesError = computed(() => !!environmentVariablesError.value)

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

      const match = normalizedLine.match(/^([A-Za-z_][A-Za-z0-9_.-]*)\s*=\s*(.*)$/)

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

    environmentVariables.value = JSON.stringify(parsed, null, 2)

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
    await fetchGlobalVariables()
  })
</script>

<template>
  <FormHorizontal
    :isDrawer="true"
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
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    :isDrawer="true"
    title="Settings"
    description="Define environment behavior and URL strategy."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldDropdown
          label="Status"
          name="status"
          required
          :options="statusOptions"
          :value="status"
          optionLabel="label"
          optionValue="value"
          appendTo="self"
          description="Choose whether this environment is currently active."
          :disabled="props.disabledFields"
          data-testid="environment-form__status-field"
        />
      </div>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldDropdown
          label="Configuration"
          name="configuration"
          required
          :options="configurationOptions"
          :value="configuration"
          optionLabel="label"
          optionValue="value"
          appendTo="self"
          description="Select how environment URLs are organized for deployments."
          :disabled="props.disabledFields"
          data-testid="environment-form__configuration-field"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    :isDrawer="true"
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
    :isDrawer="true"
    description="Define environment-specific variables manually in JSON or import a .env file."
  >
    <template #title>
      <div class="flex items-center w-full justify-between">
        <span>Custom Variables</span>
        <div class="flex items-center gap-2">
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
        </div>
      </div>
    </template>

    <template #inputs>
      <div class="flex flex-col w-full gap-3">
        <CodeEditor
          v-model="environmentVariables"
          runtime="json"
          :initialValue="environmentVariables"
          :readOnly="props.disabledFields"
          :errors="hasEnvironmentVariablesError"
          :minimap="false"
        />

        <small class="text-xs text-color-secondary font-normal leading-5">
          Use a JSON object format, for example: <code>{"API_URL":"https://example.com"}</code>
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
