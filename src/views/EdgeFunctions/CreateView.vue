<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="New Edge Function" />
    </template>
    <template #content>
      <CreateFormBlock
        :createService="props.createEdgeFunctionsService"
        :formData="values"
        :formMeta="meta"
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
                        :value="languageText"
                        id="language"
                        type="text"
                        class="w-full"
                        readonly
                      />
                    </span>
                  </div>
                </template>
              </FormHorizontal>

              <FormHorizontal
                class="mt-8"
                title="Status"
              >
                <template #inputs>
                  <div class="flex w-full sm:max-w-lg gap-2">
                    <InputSwitch v-model="active" />
                    <label
                      for="active"
                      class="text-color text-base font-medium"
                      >Active
                    </label>
                  </div>
                </template>
              </FormHorizontal>
            </TabPanel>
            <TabPanel header="Code">
              <div class="flex flex-col lg:flex-row mt-8 surface-border border rounded-md">
                <div class="w-full lg:w-2/3 pr-0 lg:pr-8">
                  <div class="w-full">
                    <vue-monaco-editor
                      v-model:value="code"
                      language="javascript"
                      :theme="theme"
                      class="min-h-[50vh] !w-[99%] surface-border border-r"
                      :class="{ 'border-red-500 border rounded-md': errors.code }"
                      :options="editorOptions"
                    />
                  </div>
                  <small
                    v-if="errors.code"
                    class="p-error text-xs font-normal"
                  >
                    {{ errors.code }}
                  </small>
                </div>

                <div class="hidden lg:block">
                  <divider layout="vertical" />
                </div>

                <div class="w-full lg:w-1/3 hidden lg:block">
                  <div class="relative overflow-hidden h-full p-5">
                    <iframe
                      class="w-full h-full border-0 overflow-hidden"
                      ref="previewIframe"
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
              <div class="flex flex-col lg:flex-row mt-8 surface-border border rounded-md">
                <div class="w-full lg:w-2/3 pr-0 lg:pr-8">
                  <vue-monaco-editor
                    v-model:value="jsonArgs"
                    language="json"
                    :theme="theme"
                    class="min-h-[50vh] !w-[99%] surface-border border-r"
                    :class="{ 'border-red-500 border rounded-md': errors.jsonArgs }"
                    :options="editorOptions"
                  />
                </div>

                <div class="hidden lg:block">
                  <divider layout="vertical" />
                </div>

                <div class="w-full lg:w-1/3 hidden lg:block">
                  <div class="relative overflow-hidden h-full p-5">
                    <iframe
                      class="w-full h-full border-0 overflow-hidden"
                      ref="previewIframeArguments"
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
      </CreateFormBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import CreateFormBlock from '@/templates/create-form-block-new'
  import FormHorizontal from '@/templates/create-form-block-new/form-horizontal'
  import { useForm, useField } from 'vee-validate'
  import * as yup from 'yup'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import InputText from 'primevue/inputtext'
  import Divider from 'primevue/divider'
  import HelloWorldSample from '@/helpers/edge-function-hello-world'
  import { ref, computed } from 'vue'
  import { useAccountStore } from '@/stores/account'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import InputSwitch from 'primevue/inputswitch'

  // Props
  const props = defineProps({
    createEdgeFunctionsService: {
      type: Function,
      required: true
    }
  })

  // Data
  const ARGS_INITIAL_STATE = '{}'
  const languageText = 'JavaScript'
  const editorOptions = {
    tabSize: 2,
    formatOnPaste: true
  }
  const previewIframe = ref(null)
  const previewIframeArguments = ref(null)

  // Using the store
  const store = useAccountStore()

  //computed
  const theme = computed(() => {
    return store.currentTheme === 'light' ? 'vs' : 'vs-dark'
  })

  const postPreviewUpdates = () => {
    if (previewIframe.value?.contentWindow) {
      const previewWindow = previewIframe.value.contentWindow
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
    }

    if (previewIframeArguments.value?.contentWindow) {
      const previewWindow = previewIframeArguments.value.contentWindow
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
    }
  }

  // Validations
  const validationSchema = yup.object({
    name: yup.string().required('Name is a required field'),
    code: yup.string().required('Code is a required field'),
    jsonArgs: yup
      .string()
      .test('curly', 'Invalid JSON', (value) => {
        return /^\{.*\}$/.test(value)
      })
      .test('empty', '', (value) => {
        if (!value) {
          setArgs(ARGS_INITIAL_STATE)
        }
        return true
      })
  })

  const { defineInputBinds, errors, meta, resetForm, values } = useForm({
    validationSchema,
    initialValues: {
      name: '',
      active: true,
      language: 'javascript',
      code: HelloWorldSample,
      jsonArgs: ARGS_INITIAL_STATE
    }
  })

  const name = defineInputBinds('name')
  const { value: jsonArgs, setValue: setArgs } = useField('jsonArgs')
  const { value: code } = useField('code')
  const { value: active } = useField('active')
</script>
