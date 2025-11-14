<script setup>
  import { computed, ref, watch, markRaw } from 'vue'
  import { useField } from 'vee-validate'

  import ResizableSplitter from '@/components/Splitter/ResizableSplitter.vue'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import PrimeButton from 'primevue/button'
  import { JsonForms } from '@jsonforms/vue'
  import { vanillaRenderers } from '@jsonforms/vue-vanilla'
  import SelectPanel from '@/components/select-panel'
  import CodeEditor from '../components/code-editor.vue'
  import CodePreview from '../components/code-preview.vue'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldTextIcon from '@/templates/form-fields-inputs/fieldTextIcon'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'
  // import { azionJsonFormWindowOpener } from '@/helpers/azion-documentation-window-opener'
  import indentJsonStringify from '@/utils/indentJsonStringify'
  import { isValidFormBuilderSchema } from '@/utils/schemaFormBuilderValidation'
  import { defaultSchemaFormBuilder } from './Config'

  defineProps(['previewData', 'run'])
  const emit = defineEmits(['update:previewData', 'update:run', 'update:name', 'additionalErrors'])

  let SPLITTER_PROPS = ref({
    height: '50vh',
    layout: 'horizontal',
    panelsSizes: [60, 40]
  })

  const previewState = ref(true)
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

  const showPreview = computed(() => {
    return previewState.value && runtime.value !== 'azion_lua'
  })

  let initialCodeValue = ''
  const initialJsonArgsValue = ref('{}')

  const unwatch = watch(name, () => {
    initialCodeValue = code.value
    initialJsonArgsValue.value = defaultArgs.value

    schemaAzionFormString.value = azionForm.value

    let parsedValue
    try {
      parsedValue = JSON.parse(azionForm.value)
    } catch (error) {
      parsedValue = {}
    }

    hasFormBuilder.value = Object.keys(parsedValue).length
    setAzionFormData(defaultArgs.value)
    setAzionFormSchema(parsedValue)
    setAzionFormEmptyState(parsedValue)

    emit('update:name', name.value)
    emit('update:run', runtime.value)

    if (initialCodeValue) {
      unwatch()
    }
  })

  const hasCodeError = computed(() => {
    return !!codeError.value
  })

  const hasAzionFormError = computed(() => {
    return !!azionFormError.value
  })

  const hasArgsError = computed(() => {
    return !!argsError.value
  })

  const updateObject = computed(() => {
    const previewValues = {
      code: code.value,
      args: defaultArgs.value
    }

    emit('update:previewData', previewValues)
    emit('update:run', runtime.value)

    return previewValues
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

  const updateSizesPainel = (value) => {
    SPLITTER_PROPS.value = {
      ...SPLITTER_PROPS.value,
      panelsSizes: value
    }
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
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <FieldText
              label="Name"
              required
              name="name"
              placeholder="My function"
              :value="name"
              description="Give a unique and descriptive name to identify the Function."
            />
          </div>
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
      <ResizableSplitter
        v-if="activeTab === 1"
        :style="{ height: SPLITTER_PROPS.height }"
        class="mt-8 surface-border border rounded-md hidden md:flex"
        @resizeend="previewState = true"
        :initialTopPanelPercent="60"
        direction="vertical"
        @update:panelSizes="updateSizesPainel"
      >
        <template #panel-a>
          <CodeEditor
            v-model="code"
            :initialValue="initialCodeValue"
            :runtime="runtimeFormat.format"
            :errors="hasCodeError"
            :readOnly="isProprietaryCode"
          />
        </template>
        <template #panel-b>
          <div
            v-if="showPreview"
            class="h-full"
          >
            <CodePreview :updateObject="updateObject" />
          </div>
        </template>
      </ResizableSplitter>

      <div
        v-if="activeTab === 1"
        class="flex flex-col mt-0 surface-border border rounded-md gap-2 md:hidden h-[50vh]"
      >
        <CodeEditor
          v-model="code"
          :initialValue="initialCodeValue"
          :runtime="runtimeFormat.format"
          :errors="hasCodeError"
        />
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

        <ResizableSplitter
          class="!z-20 relative"
          :style="{ height: SPLITTER_PROPS.height }"
          direction="vertical"
          :panelSizes="SPLITTER_PROPS.panelsSizes"
          :initialTopPanelPercent="60"
          @update:panelSizes="(val) => (SPLITTER_PROPS.panelsSizes = val)"
          @resizeend="
            () => {
              argsEditorRerenderKey++
            }
          "
          v-if="!showFormBuilder"
        >
          <template #panel-a>
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
          </template>
        </ResizableSplitter>

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
                  <!--
                  <PrimeButton
                    outlined
                    @click="azionJsonFormWindowOpener()"
                    label="Read documentation"
                    size="small"
                  />
                  -->
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
            title="No form have been created"
            description="Click the button below to create configure your form."
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
