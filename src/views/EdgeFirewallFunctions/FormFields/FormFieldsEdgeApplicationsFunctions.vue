<script setup>
  import { computed, ref, watch, markRaw } from 'vue'
  import { useField } from 'vee-validate'
  import { JsonForms } from '@jsonforms/vue'
  import { vanillaRenderers } from '@jsonforms/vue-vanilla'
  import PrimeButton from 'primevue/button'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText.vue'
  import FieldDropdownLazyLoader from '@/templates/form-fields-inputs/fieldDropdownLazyLoader.vue'
  import SelectPanel from '@/components/select-panel'
  import DescriptionText from '@/components/description-text/descriptionText'
  import TitleDescriptionArea from '@/components/title-description-area'
  import Drawer from '@/views/EdgeFunctions/Drawer/index.vue'
  import CodeEditor from '@/views/EdgeFunctions/components/code-editor.vue'
  // import { azionJsonFormWindowOpener } from '@/helpers/azion-documentation-window-opener'
  import indentJsonStringify from '@/utils/indentJsonStringify'
  import { isValidFormBuilderSchema } from '@/utils/schemaFormBuilderValidation'
  import { edgeFunctionService } from '@/services/v2'

  const emit = defineEmits(['toggleDrawer', 'additionalErrors'])

  const { value: name } = useField('name')
  const { value: edgeFunctionID } = useField('edgeFunctionID')
  const { value: args, errorMessage: argsError } = useField('args')
  const { value: azionForm } = useField('azionForm')

  const schemaAzionForm = ref({})
  const emptySchemaAzionForm = ref(true)
  const schemaAzionFormString = ref('')
  const azionFormArgsValue = ref('{}')
  const azionFormData = ref({})
  const azionFormError = ref(false)
  const azionFormValidationErrors = ref([])
  const hasFormBuilder = ref(false)
  const showFormBuilder = ref(false)
  const selectPanelOptions = ['Form', 'JSON']
  const selectPanelValue = ref(selectPanelOptions[0])
  const renderers = markRaw([...vanillaRenderers])

  const drawerRef = ref('')
  const openDrawer = () => {
    drawerRef.value.openCreateDrawer()
  }

  const handleDrawerSuccess = (functionId) => {
    edgeFunctionID.value = functionId
  }

  const changeArgs = (target) => {
    resetFormBuilder()

    if (target?.defaultArgs) {
      args.value = target?.defaultArgs
    }

    if (target?.azionForm && Object.keys(argsJsonParser(target.azionForm)).length) {
      hasFormBuilder.value = true
      schemaAzionFormString.value = target.azionForm
      azionForm.value = schemaAzionFormString.value
      showFormBuilder.value = false

      selectPanelUpdateModelValue()
    }
  }

  const listEdgeFunctionsServiceDecorator = (queryParams) => {
    return edgeFunctionService.listEdgeFunctionsDropdown({
      executionEnvironment: 'firewall',
      fields: ['id', 'name', 'default_args', 'azion_form', 'execution_environment'],
      ...queryParams
    })
  }

  const loadEdgeFunctionServiceDecorator = (queryParams) => {
    return edgeFunctionService.loadEdgeFunction({
      ...queryParams,
      fields: ['id', 'name', 'default_args', 'azion_form']
    })
  }

  const onChangeAzionForm = (event) => {
    azionFormData.value = event.data
    azionFormValidationErrors.value = event.errors || []
    azionFormArgsValue.value = indentJsonStringify(event.data)
    args.value = indentJsonStringify(event.data)

    emit('additionalErrors', azionFormValidationErrors.value)
  }

  const selectPanelUpdateModelValue = (value) => {
    selectPanelValue.value = !value ? selectPanelOptions[0] : value
  }

  const setAzionFormEmptyState = function (value) {
    emptySchemaAzionForm.value = !value || !Object.keys(value).length
  }

  const updateLabelEditForm = () => {
    return showFormBuilder.value ? 'Visual Form' : 'Edit Form'
  }

  const formBuilderToggle = () => {
    showFormBuilder.value = !showFormBuilder.value
  }

  const setAzionFormSchema = (formSchema) => {
    schemaAzionForm.value = argsJsonParser(formSchema)
  }

  const argsJsonParser = (args) => {
    let parsedValue

    try {
      parsedValue = typeof args === 'string' ? JSON.parse(args) : args
    } catch (error) {
      parsedValue = {}
    }

    return parsedValue
  }

  const resetFormBuilder = () => {
    hasFormBuilder.value = false
    azionFormData.value = {}
    schemaAzionForm.value = {}
    schemaAzionFormString.value = '{}'
    azionFormValidationErrors.value = []
    azionForm.value = schemaAzionFormString.value
    emit('additionalErrors', [])
  }

  const codeEditorFormBuilderUpdate = (value) => {
    let parsedValue

    try {
      parsedValue = typeof value === 'string' ? JSON.parse(value) : value
      const isSchemaValid = isValidFormBuilderSchema(parsedValue)

      if (isSchemaValid.valid) {
        azionFormError.value = false
        schemaAzionFormString.value = value
        azionForm.value = schemaAzionFormString.value
      } else {
        azionFormError.value = true
        parsedValue = {}
      }
    } catch (error) {
      parsedValue = {}
      azionFormError.value = true
    }

    setAzionFormEmptyState(parsedValue)
  }

  const isFirstSelectPanelValue = computed(() => {
    return selectPanelValue.value === selectPanelOptions[0]
  })

  const hasArgsError = computed(() => {
    return !!argsError.value
  })

  const hasAzionFormError = computed(() => {
    return !!azionFormError.value
  })

  watch(args, (args) => {
    try {
      azionFormArgsValue.value = indentJsonStringify(JSON.parse(args))
    } catch (error) {
      console.log(error) // eslint-disable-line
    }
  })

  watch(azionForm, (azForm) => {
    if (!Object.keys(JSON.parse(azForm)).length) return

    hasFormBuilder.value = true
    azionFormData.value = argsJsonParser(args.value)
    schemaAzionFormString.value = azForm
    azionForm.value = schemaAzionFormString.value
    azionFormValidationErrors.value = []

    setAzionFormSchema(argsJsonParser(azForm))
    setAzionFormEmptyState(argsJsonParser(azForm))
  })

  watch(
    () => drawerRef.value.showCreateDrawer,
    () => {
      emit('toggleDrawer', drawerRef.value.showCreateDrawer)
    }
  )
</script>

<template>
  <FormHorizontal
    :isDrawer="true"
    title="General"
    description="Instantiate a function within your Firewall. Use Rules Engine to activate the function."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name"
          required
          name="name"
          v-model="name"
          description="Give a unique and descriptive name to identify the Firewall function instance."
          placeholder="My Firewall function instance"
          data-testid="edge-firewall-functions-form__name-field"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    :isDrawer="true"
    title="Function"
    description="Select an existing Function and customize the arguments. Only Functions previously created in the Functions module can be instantiated."
  >
    <template #inputs>
      <div class="flex w-80 flex-col gap-2 sm:max-w-lg max-sm:w-full">
        <Drawer
          ref="drawerRef"
          @onSuccess="handleDrawerSuccess"
        />
        <FieldDropdownLazyLoader
          required
          disableEmitFirstRender
          data-testid="edge-firewall-functions-form__edge-function-dropdown"
          label="Function"
          name="edgeFunctionID"
          optionLabel="name"
          optionValue="id"
          appendTo="self"
          :service="listEdgeFunctionsServiceDecorator"
          :loadService="loadEdgeFunctionServiceDecorator"
          :moreOptions="['defaultArgs', 'azionForm']"
          :value="edgeFunctionID"
          @onSelectOption="changeArgs"
        >
          <template #footer>
            <ul class="p-2">
              <li>
                <PrimeButton
                  class="w-full whitespace-nowrap flex"
                  data-testid="edge-firewall-functions-form__create-function-button"
                  text
                  @click="openDrawer"
                  size="small"
                  icon="pi pi-plus-circle"
                  :pt="{
                    label: { class: 'w-full text-left' },
                    root: { class: 'p-2' }
                  }"
                  label="Create Function"
                />
              </li>
            </ul>
          </template>
        </FieldDropdownLazyLoader>
      </div>

      <div class="flex flex-col gap-2 w-full">
        <div v-if="hasFormBuilder">
          <SelectPanel
            :options="selectPanelOptions"
            :value="selectPanelOptions[0]"
            title="Arguments"
            description="Configure the function arguments to customize its behavior."
            @update:modelValue="selectPanelUpdateModelValue"
          >
            <template #content>
              <div v-if="isFirstSelectPanelValue">
                <div
                  id="azionform"
                  class="azion-json-form"
                >
                  <div class="flex flex-col gap-4 overflow-y-auto h-[364px]">
                    <div>
                      <div
                        v-if="showFormBuilder"
                        class="resize-y overflow-y-auto"
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
                      </div>
                      <div
                        class="max-w-[320px]"
                        v-if="!showFormBuilder && !emptySchemaAzionForm"
                      >
                        <JsonForms
                          :schema="schemaAzionForm"
                          :data="azionFormData"
                          :renderers="renderers"
                          @change="onChangeAzionForm"
                        />
                      </div>
                      <div
                        v-else
                        class="flex flex-col items-center justify-center gap-2 h-[364px]"
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
                  </div>
                </div>
              </div>
              <div v-if="selectPanelValue === selectPanelOptions[1]">
                <div class="resize-y overflow-y-auto">
                  <CodeEditor
                    v-model="azionFormArgsValue"
                    runtime="json"
                    class="overflow-clip surface-border border rounded-md"
                    :readOnly="true"
                    :initialValue="azionFormArgsValue"
                    :errors="hasArgsError"
                    :minimap="false"
                  />
                </div>
              </div>
            </template>
          </SelectPanel>
        </div>
        <div
          v-else
          class="flex flex-col gap-4"
        >
          <TitleDescriptionArea
            :title="`Arguments`"
            :description="`Configure the function arguments to customize its behavior.`"
          />
          <div class="resize-y overflow-y-auto">
            <CodeEditor
              v-model="args"
              runtime="json"
              class="overflow-clip surface-border border rounded-md"
              :initialValue="args"
              :errors="hasArgsError"
              :minimap="false"
            />
          </div>
          <small
            v-if="argsError"
            class="p-error text-xs font-normal leading-tight"
          >
            {{ argsError }}
          </small>
          <DescriptionText
            :isHtml="true"
            size="small"
            description="Customize the arguments in JSON format. Once set, they can be called in code using <code>event.args('arg_name')</code>."
          />
        </div>
      </div>

      <div
        class="flex justify-end mt-[-1rem]"
        v-if="isFirstSelectPanelValue && hasFormBuilder"
      >
        <PrimeButton
          @click="formBuilderToggle()"
          :label="updateLabelEditForm()"
          size="small"
          text
        />
      </div>
    </template>
  </FormHorizontal>
</template>
