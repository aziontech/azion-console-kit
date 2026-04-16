<script setup>
  import { computed, ref, watch, markRaw } from 'vue'
  import { useField } from 'vee-validate'

  import ResizableSplitter from '@/components/Splitter/ResizableSplitter.vue'
  import TabView from 'primevue/tabview'
  import TabPanel from '@aziontech/webkit/tabpanel'
  import PrimeButton from '@aziontech/webkit/button'
  import { JsonForms } from '@jsonforms/vue'
  import { vanillaRenderers } from '@jsonforms/vue-vanilla'
  import SelectPanel from '@/components/select-panel'
  import CodeEditor from '../components/code-editor.vue'
  import EmptyResultsBlock from '@aziontech/webkit/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import FieldText from '@aziontech/webkit/field-text'
  import FieldTextIcon from '@aziontech/webkit/field-text-icon'
  import FieldSwitchBlock from '@aziontech/webkit/field-switch-block'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldGroupRadio from '@aziontech/webkit/field-group-radio'
  import { azionJsonFormWindowOpener } from '@/helpers/azion-documentation-window-opener'
  import indentJsonStringify from '@/utils/indentJsonStringify'
  import { isValidFormBuilderSchema } from '@/utils/schemaFormBuilderValidation'
  import { defaultSchemaFormBuilder } from './Config'

  defineProps(['run'])
  const emit = defineEmits(['update:run', 'update:name', 'additionalErrors'])

  let SPLITTER_PROPS = ref({
    height: '50vh',
    layout: 'horizontal',
    panelsSizes: [60, 40]
  })

  const hasFormBuilder = ref(false)
  const showFormBuilder = ref(false)
  const azionFormData = ref({})
  const azionFormError = ref(false)
  const azionFormValidationErrors = ref([])
  const schemaAzionFormString = ref('{}')
  const emptySchemaAzionForm = ref(true)
  const selectPanelOptions = ['JSON', 'Form Builder']
  const selectPanelValue = ref(selectPanelOptions[0])
  const renderers = markRaw([...vanillaRenderers])
  const argsEditorRerenderKey = ref(0)
  const activeTab = ref(0)

  const { value: name } = useField('name')
  const { value: azionForm } = useField('azionForm')
  const { value: isProprietaryCode } = useField('isProprietaryCode')
  const { value: defaultArgs, errorMessage: argsError } = useField('defaultArgs')
  const { value: code, errorMessage: codeError } = useField('code')
  const { value: runtime } = useField('runtime')
  const { value: runtimeFormat } = useField('runtimeFormat')

  const initialCodeValue = ref('')
  const initialJsonArgsValue = ref('{}')

  const hasCodeError = computed(() => {
    return !!codeError.value
  })

  const hasAzionFormError = computed(() => {
    return !!azionFormError.value
  })

  const hasArgsError = computed(() => {
    return !!argsError.value
  })

  const executionEnvironmentOptions = [
    {
      title: 'Application',
      subtitle: 'Functions are executed at the edge to reduce latency and enhance performance.',
      inputValue: 'application'
    },
    {
      title: 'Firewall',
      subtitle: 'Functions are executed by a firewall to apply security policies.',
      inputValue: 'firewall'
    }
  ]

  const codeEditorFormBuilderUpdate = (value) => {
    let parsedValue

    try {
      parsedValue = typeof value === 'string' ? JSON.parse(value) : value
      const isSchemaValid = isValidFormBuilderSchema(parsedValue)

      if (isSchemaValid.valid) {
        azionFormError.value = false
        setAzionFormSchema(parsedValue)
        emit('additionalErrors', [])
      } else {
        parsedValue = {}
        azionFormError.value = true
        emit('additionalErrors', isSchemaValid.errors)
      }
    } catch (error) {
      parsedValue = {}
      azionFormError.value = true
      emit('additionalErrors', [error])
    }

    setAzionFormEmptyState(parsedValue)
  }

  const setAzionFormData = (value = {}) => {
    let parsedValue

    try {
      parsedValue = typeof value === 'string' ? JSON.parse(value) : value
    } catch (error) {
      parsedValue = {}
    }

    azionFormData.value = parsedValue
  }

  const codeEditorArgsUpdate = (value = '{}') => {
    defaultArgs.value = value
    setAzionFormData(value)
  }

  const selectPanelUpdateModelValue = (value) => {
    selectPanelValue.value = !value ? selectPanelOptions[0] : value
    showFormBuilder.value = value === selectPanelOptions[1]
  }

  const setAzionFormEmptyState = function (value = {}) {
    emptySchemaAzionForm.value = !value || !Object.keys(value).length
  }

  const setAzionFormSchema = (formSchema) => {
    azionForm.value = formSchema
  }

  const onChangeAzionForm = (event) => {
    azionFormValidationErrors.value = event.errors || []

    codeEditorArgsUpdate(indentJsonStringify(event.data))
    setAzionFormData(event.data)

    emit('additionalErrors', azionFormValidationErrors.value)
  }

  const setDefaultFormBuilder = () => {
    hasFormBuilder.value = true
    codeEditorFormBuilderUpdate(defaultSchemaFormBuilder)
    schemaAzionFormString.value = indentJsonStringify(defaultSchemaFormBuilder)
  }

  const resetFormBuilder = () => {
    hasFormBuilder.value = false
    azionFormData.value = setAzionFormData({})
    schemaAzionFormString.value = '{}'
    azionForm.value = {}
    emptySchemaAzionForm.value = true
    azionFormValidationErrors.value = []

    emit('additionalErrors', azionFormValidationErrors.value)
  }

  const initializeFormData = () => {
    if (!name.value) return

    initialCodeValue.value = code.value
    initialJsonArgsValue.value = defaultArgs.value

    const rawValue = azionForm.value

    if (typeof rawValue === 'string') {
      schemaAzionFormString.value = rawValue
    }

    let parsedValue
    try {
      parsedValue = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue
    } catch (error) {
      parsedValue = {}
    }

    if (!parsedValue || typeof parsedValue !== 'object') {
      parsedValue = {}
    }

    hasFormBuilder.value = !!Object.keys(parsedValue).length
    setAzionFormData(defaultArgs.value)
    setAzionFormSchema(parsedValue)
    setAzionFormEmptyState(parsedValue)

    emit('update:name', name.value)
    emit('update:run', runtime.value)
  }

  initializeFormData()

  if (!initialCodeValue.value) {
    const unwatch = watch(name, () => {
      initializeFormData()
      if (initialCodeValue.value) {
        unwatch()
      }
    })
  }

  watch(azionForm, (newValue) => {
    if (typeof newValue === 'string' && name.value) {
      initializeFormData()
    }
  })
</script>

<template>
  <TabView
    class="w-full"
    v-model:activeIndex="activeTab"
  >
    <TabPanel header="Main Settings">
      <FormHorizontal
        class="mt-8"
        title="General"
        description="Edit a Function that runs closer to users to use with Application or Firewall."
      >
        <template #inputs>
          <FieldText
            label="Name"
            required
            name="name"
            placeholder="My function"
            :value="name"
            description="Give a unique and descriptive name to identify the Function."
          />
        </template>
      </FormHorizontal>

      <FormHorizontal
        class="mt-8"
        title="Runtime"
        description="The execution runtime used to run your Function"
      >
        <template #inputs>
          <div class="flex flex-col w-full sm:max-w-lg gap-2">
            <FieldTextIcon
              label="Runtime"
              name="runtimeFormat.content"
              :value="runtimeFormat?.content"
              icon="pi pi-lock"
              disabled
              description="Runtime isn't an editable field."
            />
          </div>
        </template>
      </FormHorizontal>

      <FormHorizontal
        class="mt-8"
        title="Execution Environment"
        description="Specify the execution environment for your Function"
      >
        <template #inputs>
          <div class="flex flex-col w-full gap-2">
            <FieldGroupRadio
              required
              nameField="executionEnvironment"
              :options="executionEnvironmentOptions"
              isCard
            />
          </div>
        </template>
      </FormHorizontal>

      <FormHorizontal
        class="mt-8"
        title="Status"
      >
        <template #inputs>
          <div class="flex w-full sm:max-w-lg gap-2">
            <FieldSwitchBlock
              nameField="active"
              name="active"
              auto
              :isCard="false"
              title="Active"
            />
          </div>
        </template>
      </FormHorizontal>
    </TabPanel>

    <TabPanel header="Code">
      <div v-if="activeTab === 1">
        <div class="flex flex-col h-full gap-2 mt-8">
          <CodeEditor
            v-model="code"
            :initialValue="initialCodeValue"
            :runtime="runtimeFormat.format"
            :errors="hasCodeError"
            :readOnly="isProprietaryCode"
          />
        </div>
        <small
          v-if="codeError"
          class="p-error text-xs font-normal"
        >
          {{ codeError }}
        </small>
      </div>
    </TabPanel>

    <TabPanel header="Arguments">
      <div
        v-if="activeTab === 2"
        class="w-full mt-4"
      >
        <div class="w-full flex justify-end rounded-t-md bg-[var(--surface-300)] relative z-10">
          <SelectPanel
            :options="selectPanelOptions"
            :value="selectPanelOptions[0]"
            @update:modelValue="selectPanelUpdateModelValue"
          />
        </div>

        <div v-if="!showFormBuilder">
          <CodeEditor
            :key="argsEditorRerenderKey"
            v-model="defaultArgs"
            runtime="json"
            :initialValue="defaultArgs"
            :minimap="false"
            :errors="hasArgsError"
            class="h-full"
            @update:modelValue="codeEditorArgsUpdate"
          />
        </div>

        <div v-if="hasFormBuilder">
          <ResizableSplitter
            class="!z-20 relative"
            :style="{ height: SPLITTER_PROPS.height }"
            direction="vertical"
            :panelSizes="SPLITTER_PROPS.panelsSizes"
            @update:panelSizes="(val) => (SPLITTER_PROPS.panelsSizes = val)"
            v-if="showFormBuilder"
          >
            <template #panel-a>
              <div class="flex flex-col h-full gap-2">
                <CodeEditor
                  v-model="schemaAzionFormString"
                  runtime="json"
                  :initialValue="schemaAzionFormString"
                  :errors="hasAzionFormError"
                  :minimap="false"
                  @update:modelValue="codeEditorFormBuilderUpdate"
                />
              </div>
            </template>
            <template #panel-b>
              <div class="overflow-y-auto h-full p-4 md:p-8">
                <div
                  id="azionform"
                  class="azion-json-form"
                  v-if="!emptySchemaAzionForm"
                >
                  <JsonForms
                    :schema="azionForm"
                    :data="azionFormData"
                    :renderers="renderers"
                    @change="onChangeAzionForm"
                  />
                </div>
                <div
                  v-else
                  class="flex flex-col items-center justify-center h-full gap-2"
                >
                  <p>Configure the form builder.</p>
                  <PrimeButton
                    outlined
                    @click="azionJsonFormWindowOpener()"
                    label="Read documentation"
                    size="small"
                  />
                </div>
              </div>
              <div class="flex items-center justify-end mt-2">
                <PrimeButton
                  text
                  size="small"
                  label="Remove Form"
                  severity="danger"
                  @click="resetFormBuilder"
                />
              </div>
            </template>
          </ResizableSplitter>
        </div>

        <div v-if="selectPanelValue === selectPanelOptions[1] && !hasFormBuilder">
          <EmptyResultsBlock
            class="!min-h-[496px]"
            title="No forms yet"
            description="Create your first form to build and configure input fields for your function."
            createButtonLabel="Form Builder"
            @click-to-create="setDefaultFormBuilder"
          >
            <template #illustration>
              <Illustration />
            </template>
          </EmptyResultsBlock>
        </div>
      </div>
    </TabPanel>
  </TabView>
</template>
