<script setup>
  import { computed, ref, watch } from 'vue'

  import { JsonForms } from '@jsonforms/vue'
  import { vanillaRenderers } from '@jsonforms/vue-vanilla'

  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import PrimeButton from 'primevue/button'

  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock.vue'
  import SelectPanel from '@/components/select-panel'
  import DescriptionSmallArea from '@/components/description-small-area'
  import TitleDescriptionArea from '@/components/title-description-area'

  import Drawer from '@/views/EdgeFunctions/Drawer/index.vue'
  import { useField } from 'vee-validate'
  import CodeEditor from '@/views/EdgeFunctions/components/code-editor.vue'
  import FieldDropdownLazyLoader from '@/templates/form-fields-inputs/fieldDropdownLazyLoader.vue'
  import { edgeFunctionService } from '@/services/v2'

  const emit = defineEmits(['toggleDrawer'])
  const renderers = Object.freeze([...vanillaRenderers])

  const onChangeAzionForm = (event) => {
    azionFormData.value = event.data
    argsValue.value = JSON.stringify(event.data, null, 2)
  }

  const drawerRef = ref('')
  const openDrawer = () => {
    drawerRef.value.openCreateDrawer()
  }

  const handleDrawerSuccess = (functionId) => {
    edgeFunctionID.value = functionId
  }

  const changeArgs = async (target) => {
    if (target?.defaultArgs) {
      args.value = target.defaultArgs
    }
  }

  const listEdgeFunctionsServiceDecorator = (queryParams) => {
    return edgeFunctionService.listEdgeFunctionsDropdown({
      executionEnvironment: 'firewall',
      fields: ['id', 'name', 'default_args', 'execution_environment'],
      ...queryParams
    })
  }

  const loadEdgeFunctionServiceDecorator = (queryParams) => {
    return edgeFunctionService.loadEdgeFunction({
      ...queryParams,
      fields: ['id', 'name', 'default_args']
    })
  }

  const { value: name } = useField('name')
  const { value: edgeFunctionID } = useField('edgeFunctionID')
  const { value: args, errorMessage: argsError } = useField('args')

  const schemaAzionForm = ref(null)
  const schemaAzionFormString = ref('')
  const azionFormData = ref({})
  const showFormBuilder = ref(false)
  const argsValue = ref('{}')
  const selectPanelOptions = ['Form', 'JSON']
  const selectPanelValue = ref(selectPanelOptions[0])

  const indentJsonStringify = (json, indentation = 2) => {
    return JSON.stringify(json, null, indentation)
  }

  const selectPanelUpdateModelValue = (value) => {
    selectPanelValue.value = !value ? selectPanelOptions[0] : value
  }

  const isToShowFormBuilder = (value) => {
    showFormBuilder.value = value

    if (!value) {
      setAzionFormSchema(JSON.parse(schemaAzionFormString.value))
    }
  }

  const setAzionFormSchema = (formSchema) => {
    schemaAzionForm.value = formSchema
    schemaAzionFormString.value = indentJsonStringify(formSchema)
  }

  const setFuntionArgs = (jsonargs) => {
    const jsonArgs = argsJsonParser(jsonargs)

    delete jsonArgs.azion_form

    argsValue.value = indentJsonStringify(jsonArgs)
    azionFormData.value = jsonArgs
  }

  const argsJsonParser = (args) => {
    try {
      return JSON.parse(args)
    } catch (error) {
      console.error(`argsJsonParser error: `, error) // eslint-disable-line

      return {}
    }
  }

  const getAzionFormData = (jsonArgs) => {
    return argsJsonParser(jsonArgs).azion_form
  }

  const hasArgsError = computed(() => {
    return !!argsError.value
  })

  watch(args, (args) => {
    setAzionFormSchema(getAzionFormData(args))
    setFuntionArgs(args)
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
    description="Instantiate an edge function within your edge firewall. Use Rules Engine to activate the function."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name"
          required
          name="name"
          v-model="name"
          description="Give a unique and descriptive name to identify the edge firewall function instance."
          placeholder="My edge firewall function instance"
          data-testid="edge-firewall-functions-form__name-field"
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
          label="Edge Function"
          name="edgeFunctionID"
          required
          :service="listEdgeFunctionsServiceDecorator"
          :loadService="loadEdgeFunctionServiceDecorator"
          :value="edgeFunctionID"
          :moreOptions="['defaultArgs']"
          disableEmitFirstRender
          @onSelectOption="changeArgs"
          optionLabel="name"
          optionValue="id"
          appendTo="self"
          data-testid="edge-firewall-functions-form__edge-function-dropdown"
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
                  label="Create Edge Function"
                />
              </li>
            </ul>
          </template>
        </FieldDropdownLazyLoader>
      </div>

      <!-- Edge Functions Dynamic Args -->
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
              <div v-show="selectPanelValue === 'Form'">
                <div id="azionform">
                  <div
                    v-if="schemaAzionFormString"
                    class="flex flex-col gap-4"
                  >
                    <FieldSwitchBlock
                      title="Form builder"
                      name="formBuilder"
                      nameField="formBuilder"
                      description="Use the enable/disable switch to toggle between form builder and visual editing modes."
                      @onSwitchChange="
                        (value) => {
                          isToShowFormBuilder(value)
                        }
                      "
                    />

                    <div>
                      <div
                        v-show="showFormBuilder"
                        class="resize-y overflow-y-auto"
                      >
                        <div v-show="schemaAzionFormString">
                          <CodeEditor
                            v-model="schemaAzionFormString"
                            runtime="json"
                            class="overflow-clip surface-border border rounded-md"
                            :initialValue="schemaAzionFormString"
                            :errors="hasArgsError"
                            :minimap="false"
                          />
                        </div>
                      </div>
                      <div v-show="!showFormBuilder">
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
              <div v-show="selectPanelValue === 'JSON'">
                <div class="resize-y overflow-y-auto">
                  <CodeEditor
                    v-model="argsValue"
                    runtime="json"
                    class="overflow-clip surface-border border rounded-md"
                    :initialValue="argsValue"
                    :readOnly="schemaAzionForm ? true : false"
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
              v-model="argsValue"
              runtime="json"
              class="overflow-clip surface-border border rounded-md"
              :initialValue="argsValue"
              :readOnly="schemaAzionForm ? true : false"
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
      </div>
    </template>
  </FormHorizontal>
</template>
