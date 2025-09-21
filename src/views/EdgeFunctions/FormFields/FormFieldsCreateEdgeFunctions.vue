<script setup>
  import { computed, ref, markRaw } from 'vue'
  import { useField } from 'vee-validate'
  import Splitter from 'primevue/splitter'
  import SplitterPanel from 'primevue/splitterpanel'
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
  import HelloWorldSample from '@/helpers/edge-function-hello-world'
  import indentJsonStringify from '@/utils/indentJsonStringify'
  import { isValidFormBuilderSchema } from '@/utils/schemaFormBuilderValidation'
  import { defaultSchemaFormBuilder } from './Config'

  defineProps({
    isDrawer: {
      type: Boolean,
      default: false
    },
    previewData: {
      type: Object
    }
  })

  const emit = defineEmits(['update:previewData', 'additionalErrors'])

  const SPLITTER_PROPS = {
    height: '50vh',
    layout: 'horizontal',
    panelsSizes: [60, 40]
  }

  const ARGS_INITIAL_STATE = '{}'
  const LANGUAGE_LABEL = 'JavaScript'
  const showPreview = ref(true)
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

  const { value: name } = useField('name')
  const { value: azionForm } = useField('azionForm')
  const { value: defaultArgs, errorMessage: argsError } = useField('defaultArgs', null, {
    initialValue: ARGS_INITIAL_STATE
  })
  const { value: code, errorMessage: codeError } = useField('code', null, {
    initialValue: HelloWorldSample
  })

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

  const setAzionFormEmptyState = function (value) {
    emptySchemaAzionForm.value = !Object.keys(value).length
  }

  const setAzionFormSchema = (formSchema) => {
    azionForm.value = formSchema
  }

  const hasCodeError = computed(() => {
    return !!codeError.value
  })

  const hasArgsError = computed(() => {
    return !!argsError.value
  })

  const hasAzionFormError = computed(() => {
    return !!azionFormError.value
  })

  const updateObject = computed(() => {
    const previewValues = {
      code: code.value,
      args: defaultArgs.value
    }

    emit('update:previewData', previewValues)

    return previewValues
  })

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
</script>

<template>
  <TabView class="w-full">
    <TabPanel header="Main Settings">
      <FormHorizontal
        class="mt-8"
        :isDrawer="isDrawer"
        title="General"
        description="Create Functions that run closer to users to use with Application or Firewall."
      >
        <template #inputs>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <FieldText
              label="Name"
              required
              name="name"
              placeholder="My Function"
              :value="name"
              description="Give a unique and descriptive name to identify the Function."
            />
          </div>
        </template>
      </FormHorizontal>

      <FormHorizontal
        class="mt-8"
        title="Runtime"
        :isDrawer="isDrawer"
        description="The execution runtime used to run your Function"
      >
        <template #inputs>
          <div class="flex flex-col w-full sm:max-w-lg gap-2">
            <FieldTextIcon
              label="Runtime"
              name="LANGUAGE_LABEL"
              icon="pi pi-lock"
              disabled
              :value="LANGUAGE_LABEL"
              description="Currently, only JavaScript is supported."
            />
          </div>
        </template>
      </FormHorizontal>

      <FormHorizontal
        v-if="!isDrawer"
        class="mt-8"
        title="Execution Environment"
        description="Specify the execution environment for your Function"
      >
        <template #inputs>
          <div class="flex flex-col w-full gap-2">
            <FieldGroupRadio
              required
              nameField="executionEnvironment"
              isCard
              :options="executionEnvironmentOptions"
            />
          </div>
        </template>
      </FormHorizontal>

      <FormHorizontal
        class="mt-8"
        title="Status"
        :isDrawer="isDrawer"
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
      <Splitter
        :style="{ height: SPLITTER_PROPS.height }"
        class="mt-8 surface-border border rounded-md hidden md:flex"
        @resizestart="showPreview = false"
        @resizeend="showPreview = true"
        :layout="SPLITTER_PROPS.layout"
        :pt="{
          gutter: { style: { backgroundColor: 'transparent' } },
          gutterHandle: { style: { backgroundColor: 'transparent' } }
        }"
      >
        <SplitterPanel
          :size="SPLITTER_PROPS.panelsSizes[0]"
          class="flex flex-col h-full gap-2"
        >
          <CodeEditor
            v-model="code"
            :initialValue="HelloWorldSample"
            runtime="javascript"
            :errors="hasCodeError"
          />
          <small
            v-if="codeError"
            class="p-error text-xs font-normal"
          >
            {{ codeError }}
          </small>
        </SplitterPanel>

        <SplitterPanel :size="SPLITTER_PROPS.panelsSizes[1]">
          <CodePreview
            v-if="showPreview"
            :updateObject="updateObject"
          />
        </SplitterPanel>
      </Splitter>
      <div class="flex flex-col mt-8 surface-border border rounded-md gap-2 md:hidden h-[50vh]">
        <CodeEditor
          v-model="code"
          :initialValue="HelloWorldSample"
          runtime="javascript"
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
      <div class="relative z-8 w-full">
        <div class="absolute top-0 right-8 z-10 flex mt-[1rem]">
          <SelectPanel
            :options="selectPanelOptions"
            :value="selectPanelOptions[0]"
            @update:modelValue="selectPanelUpdateModelValue"
          />
        </div>

        <Splitter
          :style="{ height: SPLITTER_PROPS.height }"
          class="mt-8 surface-border border rounded-md hidden md:flex"
          @resizestart="showPreview = false"
          @resizeend="showPreview = true"
          :layout="SPLITTER_PROPS.layout"
          :pt="{
            gutter: { style: { backgroundColor: 'transparent' } },
            gutterHandle: { style: { backgroundColor: 'transparent' } }
          }"
          v-if="!showFormBuilder"
        >
          <SplitterPanel :size="SPLITTER_PROPS.panelsSizes[0]">
            <CodeEditor
              v-model="defaultArgs"
              runtime="json"
              :initialValue="defaultArgs"
              :minimap="false"
              :errors="hasArgsError"
              @update:modelValue="codeEditorArgsUpdate"
            />
          </SplitterPanel>
        </Splitter>
        <div v-if="hasFormBuilder">
          <Splitter
            :style="{ height: SPLITTER_PROPS.height }"
            class="mt-8 surface-border border rounded-md hidden md:flex"
            @resizestart="showPreview = false"
            @resizeend="showPreview = true"
            :layout="SPLITTER_PROPS.layout"
            :pt="{
              gutter: { style: { backgroundColor: 'transparent' } },
              gutterHandle: { style: { backgroundColor: 'transparent' } }
            }"
            v-if="showFormBuilder"
          >
            <SplitterPanel
              :size="SPLITTER_PROPS.panelsSizes[0]"
              class="flex flex-col h-full gap-2"
            >
              <CodeEditor
                v-model="schemaAzionFormString"
                runtime="json"
                class="overflow-clip surface-border border rounded-md"
                :initialValue="schemaAzionFormString"
                :errors="hasAzionFormError"
                :minimap="false"
                @update:modelValue="codeEditorFormBuilderUpdate"
              />
            </SplitterPanel>
            <SplitterPanel :size="SPLITTER_PROPS.panelsSizes[1]">
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
            </SplitterPanel>
          </Splitter>
        </div>

        <div
          v-if="selectPanelValue === selectPanelOptions[1] && !hasFormBuilder"
          class="mt-8"
        >
          <EmptyResultsBlock
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

        <div class="flex flex-col mt-8 surface-border border rounded-md md:hidden h-[50vh]">
          <CodeEditor
            v-model="defaultArgs"
            runtime="json"
            :initialValue="ARGS_INITIAL_STATE"
            :errors="hasArgsError"
          />
        </div>
      </div>
    </TabPanel>
  </TabView>
</template>
