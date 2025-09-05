<script setup>
  import { computed, ref, watch, markRaw } from 'vue'
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
  import { azionJsonFormWindowOpener } from '@/helpers/azion-documentation-window-opener'
  import indentJsonStringify from '@/utils/indentJsonStringify'

  defineProps(['previewData', 'run'])
  const emit = defineEmits(['update:previewData', 'update:run', 'update:name'])

  const SPLITTER_PROPS = {
    height: '55vh',
    layout: 'horizontal',
    panelsSizes: [60, 40]
  }
  const ARGS_INITIAL_STATE = '{}'

  const previewState = ref(true)
  const showFormBuilder = ref(false)
  const azionFormData = ref({})
  const schemaAzionFormString = ref('{}')
  const emptySchemaAzionForm = ref(true)
  const selectPanelOptions = ['JSON', 'Form Builder']
  const selectPanelValue = ref(selectPanelOptions[0])
  const renderers = markRaw([...vanillaRenderers])

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
      title: 'Edge Application',
      subtitle: 'Functions are executed at the edge to reduce latency and enhance performance.',
      inputValue: 'application'
    },
    {
      title: 'Edge Firewall',
      subtitle: 'Functions are executed by a firewall to apply security policies.',
      inputValue: 'firewall'
    }
  ]

  const codeEditorFormBuilderUpdate = (value) => {
    let parsedValue

    try {
      parsedValue = typeof value === 'string' ? JSON.parse(value) : value
    } catch (error) {
      parsedValue = {}
    }

    setAzionFormSchema(parsedValue)
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
    showFormBuilder.value = value === selectPanelOptions[1] ? true : false
  }

  const setAzionFormEmptyState = function (value) {
    emptySchemaAzionForm.value = !value || !Object.keys(value).length ? true : false
  }

  const setAzionFormSchema = (formSchema) => {
    azionForm.value = formSchema
  }

  const onChangeAzionForm = (event) => {
    codeEditorArgsUpdate(indentJsonStringify(event.data))
    setAzionFormData(event.data)
  }

  const setDefaultFormBuilder = () => {
    const schema = {
      type: 'object',
      properties: {
        cookie_name: {
          type: 'string',
          title: 'Cookie Name',
          description: 'Nome do cookie usado para armazenar a variação do teste A/B',
          default: 'azion_cookie',
          minLength: 1
        },
        domain: {
          type: 'string',
          title: 'Domain',
          description: "Domínio onde o cookie será válido (use '.' no início para subdomínios)",
          default: '.azion.com',
          pattern: '^[.]?[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\\.[a-zA-Z]{2,}$'
        },
        max_age: {
          type: 'integer',
          title: 'Max Age (seconds)',
          description: 'Tempo de vida do cookie em segundos',
          default: 180,
          minimum: 1,
          maximum: 31536000
        },
        path: {
          type: 'string',
          title: 'Path',
          description: 'Caminho onde o cookie será válido',
          default: '/',
          pattern: '^/'
        },
        values: {
          type: 'array',
          title: 'Test Variations',
          description: 'Lista de variações do teste A/B com seus respectivos pesos',
          minItems: 2,
          maxItems: 10,
          items: {
            type: 'object',
            properties: {
              value: {
                type: 'string',
                title: 'Variation Value',
                description: 'Identificador único da variação',
                minLength: 1,
                maxLength: 50,
                pattern: '^[a-zA-Z0-9_-]+$'
              },
              weight: {
                type: 'integer',
                title: 'Weight',
                description: 'Peso da variação (maior peso = maior probabilidade)',
                minimum: 1,
                maximum: 100
              }
            },
            required: ['value', 'weight'],
            additionalProperties: false
          }
        }
      },
      required: ['cookie_name', 'domain', 'max_age', 'values']
    }

    codeEditorFormBuilderUpdate(schema)
    schemaAzionFormString.value = indentJsonStringify(schema)
  }

  const resetFormBuilder = () => {
    showFormBuilder.value = false
    azionFormData.value = setAzionFormData({})

    schemaAzionFormString.value = '{}'
    azionForm.value = {}
    emptySchemaAzionForm.value = true
    selectPanelUpdateModelValue()
  }
</script>

<template>
  <TabView class="w-full">
    <TabPanel header="Main Settings">
      <FormHorizontal
        class="mt-8"
        title="General"
        description="Edit an edge function that runs closer to users to use with Edge Application or Edge Firewall."
      >
        <template #inputs>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <FieldText
              label="Name"
              required
              name="name"
              placeholder="My function"
              :value="name"
              description="Give a unique and descriptive name to identify the function."
            />
          </div>
        </template>
      </FormHorizontal>

      <FormHorizontal
        class="mt-8"
        title="Runtime"
        description="The execution runtime used to run your edge function"
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
        description="Specify the execution environment for your edge function"
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
      <Splitter
        :style="{ height: SPLITTER_PROPS.height }"
        class="mt-8 surface-border border rounded-md hidden md:flex"
        @resizestart="previewState = false"
        @resizeend="previewState = true"
        :layout="SPLITTER_PROPS.layout"
      >
        <SplitterPanel
          :size="SPLITTER_PROPS.panelsSizes[0]"
          class="flex flex-col h-full gap-2"
        >
          <CodeEditor
            v-model="code"
            :initialValue="initialCodeValue"
            :runtime="runtimeFormat.format"
            :errors="hasCodeError"
            :readOnly="isProprietaryCode"
          />
          <small
            v-if="codeError"
            class="p-error text-xs font-normal"
          >
            {{ codeError }}
          </small>
        </SplitterPanel>

        <SplitterPanel
          v-if="showPreview"
          :size="SPLITTER_PROPS.panelsSizes[1]"
        >
          <CodePreview :updateObject="updateObject" />
        </SplitterPanel>
      </Splitter>

      <div class="flex flex-col mt-8 surface-border border rounded-md gap-2 md:hidden h-[50vh]">
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
      <div class="relative z-8 w-full">
        <div class="absolute top-0 right-4 z-10 flex mt-[1rem]">
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
        <div v-if="!emptySchemaAzionForm">
          <Splitter
            :style="{ height: SPLITTER_PROPS.height }"
            class="mt-8 surface-border border rounded-md hidden md:flex"
            @resizestart="showPreview = false"
            @resizeend="showPreview = true"
            :layout="SPLITTER_PROPS.layout"
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
                :errors="false"
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
            </SplitterPanel>
          </Splitter>
        </div>

        <div
          v-if="selectPanelValue === selectPanelOptions[1] && emptySchemaAzionForm"
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
