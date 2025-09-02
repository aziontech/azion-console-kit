<script setup>
  import { computed, ref, watch, markRaw } from 'vue'
  import { useField } from 'vee-validate'
  import PrimeButton from 'primevue/button'
  import { JsonForms } from '@jsonforms/vue'
  import { vanillaRenderers } from '@jsonforms/vue-vanilla'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldDropdownLazyLoader from '@/templates/form-fields-inputs/fieldDropdownLazyLoader'
  import SelectPanel from '@/components/select-panel'
  import DescriptionText from '@/components/description-text/descriptionText'
  import TitleDescriptionArea from '@/components/title-description-area'
  import CodeEditor from '@/views/EdgeFunctions/components/code-editor.vue'
  import Drawer from '@/views/EdgeFunctions/Drawer/index.vue'
  import indentJsonStringify from '@/utils/indentJsonStringify'
  import { edgeFunctionService } from '@/services/v2'

  const emit = defineEmits(['toggleDrawer'])

  const renderers = markRaw([...vanillaRenderers])

  const { value: name } = useField('name')
  const { value: edgeFunctionID } = useField('edgeFunctionID')
  const { value: args, errorMessage: argsError } = useField('args')
  const { value: azionForm } = useField('azionForm')

  const schemaAzionForm = ref(null)
  const schemaAzionFormString = ref('')
  const azionFormArgsValue = ref('{}')
  const azionFormData = ref({})
  const showFormBuilder = ref(false)
  const selectPanelOptions = ['Visual', 'Raw JSON']
  const selectPanelValue = ref(selectPanelOptions[0])

  const drawerRef = ref('')
  const openDrawer = () => {
    drawerRef.value.openCreateDrawer()
  }

  const handleDrawerSuccess = (functionId) => {
    edgeFunctionID.value = functionId
  }

  const changeArgs = (target) => {
    if (target?.defaultArgs) {
      args.value = target?.defaultArgs
    }

    if (target?.azionForm) {
      selectPanelUpdateModelValue()
      azionForm.value = target?.azionForm
    }
  }

  const listEdgeFunctionsServiceDecorator = (queryParams) => {
    return edgeFunctionService.listEdgeFunctionsDropdown({
      executionEnvironment: 'application',
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
    azionFormArgsValue.value = JSON.stringify(event.data, null, 2)
    args.value = JSON.stringify(event.data, null, 2)
  }

  const selectPanelUpdateModelValue = (value) => {
    selectPanelValue.value = !value ? selectPanelOptions[0] : value
  }

  const updateLabelEditForm = () => {
    return showFormBuilder.value ? 'Visual form' : 'Edit form'
  }

  const formBuilderToggle = () => {
    showFormBuilder.value = showFormBuilder.value === false ? true : false

    if (!showFormBuilder.value) {
      setAzionFormSchema(JSON.parse(schemaAzionFormString.value))
    }
  }

  const setAzionFormSchema = (formSchema) => {
    schemaAzionForm.value = formSchema
    schemaAzionFormString.value = indentJsonStringify(formSchema)
  }

  const argsJsonParser = (args) => {
    try {
      return JSON.parse(args)
    } catch (error) {
      console.error(`argsJsonParser error: `, error) // eslint-disable-line

      return {}
    }
  }

  const resetFormBuilder = () => {
    schemaAzionForm.value = null
    schemaAzionFormString.value = ''
    azionFormData.value = {}
  }

  const hasArgsError = computed(() => {
    return !!argsError.value
  })

  watch(args, (args) => {
    azionFormArgsValue.value = args
  })

  watch(azionForm, (azionForm) => {
    if (!Object.keys(JSON.parse(azionForm)).length) {
      resetFormBuilder()
      return
    }

    azionFormData.value = argsJsonParser(args.value)
    setAzionFormSchema(argsJsonParser(azionForm))
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
    description="Instantiate a serverless function created with Edge Functions within the edge application. Use Rules Engine to activate the function."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          data-testid="edge-application-function-instance-form__name-field"
          label="Name"
          required
          name="name"
          v-model="name"
          placeholder="My edge application function instance"
          description="Give a unique and descriptive name to identify the function instance."
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    :isDrawer="true"
    title="Edge Function"
    description="Select an existing edge function and customize the arguments. Only edge functions previously created in the Edge Functions module can be instantiated."
  >
    <template #inputs>
      <div class="flex w-80 flex-col gap-2 sm:max-w-lg max-sm:w-full">
        <Drawer
          ref="drawerRef"
          @onSuccess="handleDrawerSuccess"
        />

        <FieldDropdownLazyLoader
          data-testid="edge-application-function-instance-form__edge-function"
          label="Edge Function"
          required
          name="edgeFunctionID"
          :service="listEdgeFunctionsServiceDecorator"
          :loadService="loadEdgeFunctionServiceDecorator"
          :moreOptions="['defaultArgs', 'azionForm']"
          disableEmitFirstRender
          optionLabel="name"
          optionValue="id"
          :value="edgeFunctionID"
          inputId="edgeFunctionID"
          @onSelectOption="changeArgs"
        >
          <template #footer>
            <ul class="p-2">
              <li>
                <PrimeButton
                  class="w-full whitespace-nowrap flex"
                  data-testid="edge-applications-functions-form__create-function-button"
                  text
                  @click="openDrawer"
                  size="small"
                  icon="pi pi-plus-circle"
                  :pt="{
                    label: { class: 'w-full text-left' },
                    root: { class: 'p-2' }
                  }"
                  label="Create Edge Function"
                />
              </li>
            </ul>
          </template>
        </FieldDropdownLazyLoader>
      </div>

      <div class="flex flex-col gap-2 w-full">
        <div v-if="schemaAzionForm">
          <SelectPanel
            :options="selectPanelOptions"
            :value="selectPanelOptions[0]"
            :title="`Arguments`"
            :description="`Configure the function arguments to customize its behavior.`"
            @update:modelValue="selectPanelUpdateModelValue"
          >
            <template #content>
              <div v-if="selectPanelValue === selectPanelOptions[0]">
                <div
                  id="azionform"
                  class="azion-json-form"
                >
                  <div
                    v-if="schemaAzionFormString"
                    class="flex flex-col gap-4"
                  >
                    <div>
                      <div
                        v-show="showFormBuilder && schemaAzionFormString"
                        class="resize-y overflow-y-auto"
                      >
                        <CodeEditor
                          v-model="schemaAzionFormString"
                          runtime="json"
                          class="overflow-clip surface-border border rounded-md"
                          :initialValue="schemaAzionFormString"
                          :errors="hasArgsError"
                          :minimap="false"
                        />
                      </div>
                      <div
                        class="max-w-[320px]"
                        v-show="!showFormBuilder"
                      >
                        <JsonForms
                          :renderers="renderers"
                          :data="azionFormData"
                          :schema="schemaAzionForm"
                          @change="onChangeAzionForm"
                        />
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
                    :readOnly="schemaAzionForm ? true : false"
                    :initialValue="azionFormArgsValue"
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
                <DescriptionSmallArea
                  description="Customize the arguments in JSON format. Once set, they can be called in code using <code>event.args('arg_name')</code>."
                />
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
        v-if="selectPanelValue === selectPanelOptions[0] && schemaAzionFormString"
      >
        <PrimeButton
          @click="formBuilderToggle()"
          :label="updateLabelEditForm()"
          class="text-sm p-0"
          link
        />
      </div>
    </template>
  </FormHorizontal>
</template>
