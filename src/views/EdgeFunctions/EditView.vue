<template>
  <EditFormBlock
    pageTitle="Edit Edge Functions"
    :editService="props.editEdgeFunctionsService"
    :loadService="props.loadEdgeFunctionsService"
    :initialDataSetter="setValues"
    :formData="values"
    :formMeta="meta"
    :isValid="meta.valid"
    :cleanFormCallback="resetForm"
    :hasTabs="true"
  >
    <template #form>
      <TabView class="w-full">
        <TabPanel header="Main Settings">
          <FormHorizontal
            class="mt-8"
            title="General"
            description="Describe the Edge Function and choose a name to better identify."
          >
            <template #inputs>
              <div class="flex flex-col sm:max-w-lg w-full gap-2">
                <label
                  for="name"
                  class="text-color text-base font-medium"
                  >Name *</label
                >
                <InputText
                  v-bind="name"
                  id="name"
                  type="text"
                  :class="{ 'p-invalid': errors.name }"
                  v-tooltip.top="{ value: errors.name, showDelay: 200 }"
                />
                <small
                  v-if="errors.name"
                  class="p-error text-xs font-normal leading-tight"
                  >{{ errors.name }}</small
                >
              </div>
            </template>
          </FormHorizontal>

          <FormHorizontal
            class="mt-8"
            title="Language"
            description="It is currently not possible to choose a language to code a new Edge function."
          >
            <template #inputs>
              <div class="flex flex-col w-full sm:max-w-lg gap-2">
                <label
                  for="language"
                  class="text-color text-base font-medium"
                  >Language</label
                >
                <span class="p-input-icon-right">
                  <i class="pi pi-lock text-[var(--text-color-secondary)]" />
                  <InputText
                    v-model="languageText"
                    id="language"
                    type="text"
                    class="w-full text-[var(--text-color-secondary)]"
                    readonly
                  />
                </span>
              </div>
            </template>
          </FormHorizontal>
        </TabPanel>

        <TabPanel header="Code">
          <div class="flex flex-col lg:flex-row mt-8">
            <div class="w-full lg:w-1/2 pr-8">
              <vue-monaco-editor
                v-model:value="code"
                language="javascript"
                theme="vs"
                class="min-h-[50vh] !w-[99%] surface-border border rounded-md"
                :class="{ 'border-red-500 border': errorCode }"
                v-tooltip.top="{ value: errorCode, showDelay: 200 }"
                :options="editorOptions"
                @change="changeValidateCode"
              />
            </div>

            <div class="hidden lg:block">
              <divider layout="vertical" />
            </div>

            <div class="w-full lg:w-1/2 hidden lg:block">
              <div class="relative overflow-hidden h-full p-5">
                <iframe
                  class="w-full h-full border-0 overflow-hidden"
                  ref="previewIframe"
                  frameborder="0"
                  @load="postPreviewUpdates"
                  allowfullscreen
                  src="https://code-preview.azion.com/preview"
                  title="preview"
                  sandbox="allow-scripts"
                ></iframe>
              </div>
            </div>
          </div>
        </TabPanel>

        <TabPanel header="Arguments">
          <div class="flex flex-col lg:flex-row mt-8">
            <div class="w-full lg:w-1/2 pr-8">
              <vue-monaco-editor
                v-model:value="jsonArgs"
                language="json"
                theme="vs"
                class="min-h-[50vh] !w-[99%] surface-border border rounded-md"
                :class="{ 'border-red-500 border': errorCode }"
                @change="changeValidateArgs"
                v-tooltip.top="{ value: errorCode, showDelay: 200 }"
                :options="editorOptions"
              />
            </div>

            <div class="hidden lg:block">
              <divider layout="vertical" />
            </div>

            <div class="w-full lg:w-1/2 hidden lg:block">
              <div class="relative overflow-hidden h-full p-5">
                <iframe
                  class="w-full h-full border-0 overflow-hidden"
                  ref="previewIframeArguments"
                  frameborder="0"
                  @load="postPreviewUpdates"
                  allowfullscreen
                  src="https://code-preview.azion.com/preview"
                  title="preview"
                  sandbox="allow-scripts"
                ></iframe>
              </div>
            </div>
          </div>
        </TabPanel>
      </TabView>
    </template>
  </EditFormBlock>
</template>

<script setup>
  import EditFormBlock from '@/templates/edit-form-block-new'
  import FormHorizontal from '@/templates/create-form-block-new/form-horizontal'
  import { useForm, useField } from 'vee-validate'
  import * as yup from 'yup'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import InputText from 'primevue/inputtext'
  import Divider from 'primevue/divider'
  import { computed, ref, watch } from 'vue'

  // Props
  const props = defineProps({
    loadEdgeFunctionsService: {
      type: Function,
      required: true
    },
    editEdgeFunctionsService: {
      type: Function,
      required: true
    }
  })

  // Data
  const ARGS_INITIAL_STATE = '{}'
  const editorOptions = {
    tabSize: 2,
    formatOnPaste: true
  }
  const previewIframe = ref(null)
  const previewIframeArguments = ref(null)

  // Methods

  let errorCode = ''
  const changeValidateCode = () => {
    errorCode = ''
    if (code.value === '') {
      errorCode = 'code is a required field'
      return
    }
    postPreviewUpdates()
  }

  const changeValidateArgs = () => {
    if (jsonArgs.value === '') {
      setArgs(ARGS_INITIAL_STATE)
      return
    }
    postPreviewUpdates()
  }

  const postPreviewUpdates = () => {
    const previewWindow = previewIframe.value.contentWindow
    const previewWindowArguments = previewIframeArguments.value.contentWindow
    const updateObject = {
      code: code.value,
      args: jsonArgs.value
    }

    previewWindow.postMessage(
      {
        event: 'azion-code-editor',
        eventType: 'update',
        source: window.location.href,
        message: JSON.stringify(updateObject)
      },
      '*'
    )
    previewWindowArguments.postMessage(
      {
        event: 'azion-code-editor',
        eventType: 'update',
        source: window.location.href,
        message: JSON.stringify(updateObject)
      },
      '*'
    )
  }

  const getLanguageText = (language) => {
    if (language === 'javascript') return 'JavaScript'
    if (language === 'lua') return 'Lua'
    return language
  }

  // Validations

  const validationSchema = yup.object({
    name: yup.string().required('Name is a required field')
  })

  const { setValues, defineInputBinds, errors, meta, values } = useForm({
    validationSchema,
    initialValues: {
      name: '',
      active: true,
      code: `'Type your code here...'`,
      jsonArgs: ARGS_INITIAL_STATE
    }
  })

  const name = defineInputBinds('name', { validateOnInput: true })

  const { value: jsonArgs, setValue: setArgs } = useField('jsonArgs')
  const { value: code } = useField('code')
  const { value: language } = useField('language')

  // Watchs

  let initialLoad = false
  watch(code, () => {
    if (!initialLoad) {
      postPreviewUpdates()
      initialLoad = true
    }
  })

  const languageText = computed(() => {
    return getLanguageText(language.value)
  })
</script>
