<template>
  <PageHeadingBlock pageTitle="Create Edge Functions">
    <template #tabs>
      <TabView class="w-full">
        <TabPanel header="Code">
          <CreateFormBlock
            pageTitle="Create Edge Functions"
            :createService="props.createEdgeFunctionsService"
            :formData="values"
            :isValid="meta.valid"
            :cleanFormCallback="resetForm"
          >
            <template #raw-form>
              <div class="flex flex-col md:flex-row">
                <div class="w-full md:w-1/2">
                  <div class="flex flex-col gap-4">
                    <label>Edge Function Name: *</label>
                    <InputText
                      placeholder="Insert the Edge Functions Name"
                      v-bind="name"
                      type="text"
                      :class="{ 'p-invalid': errors.name }"
                      v-tooltip.top="errors.name"
                    />

                    <label>Function Code: *</label>
                    <div class="w-full flex justify-center">
                      <vue-monaco-editor
                        v-model:value="code"
                        language="javascript"
                        theme="vs-dark"
                        class="min-h-[50vh] !w-[99%]"
                        :class="{ 'border-red-500 border': errorCode }"
                        @change="changeValidateCode"
                        v-tooltip.top="errorCode"
                        :options="editorOptions"
                      />
                    </div>
                  </div>
                </div>

                <div class="hidden md:block">
                  <divider layout="vertical" />
                </div>

                <div class="w-full md:w-1/2 hidden md:block">
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
            </template>
          </CreateFormBlock>
        </TabPanel>
        <TabPanel header="Arguments">
          <CreateFormBlock
            pageTitle="Create Edge Functions"
            :createService="props.createEdgeFunctionsService"
            :formData="values"
            :isValid="meta.valid"
            :cleanFormCallback="resetForm"
          >
            <template #raw-form>
              <div class="flex flex-col md:flex-row">
                <div class="w-full md:w-1/2">
                  <div class="flex flex-col gap-4">
                    <label>Function Args: *</label>
                    <div class="w-full flex justify-center">
                      <vue-monaco-editor
                        v-model:value="jsonArgs"
                        language="json"
                        theme="vs-dark"
                        class="min-h-[50vh] !w-[99%]"
                        :class="{ 'border-red-500 border': errorCode }"
                        @change="changeValidateArgs"
                        v-tooltip.top="errorCode"
                        :options="editorOptions"
                      />
                    </div>
                  </div>
                </div>

                <div class="hidden md:block">
                  <divider layout="vertical" />
                </div>

                <div class="w-full md:w-1/2 hidden md:block">
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
            </template>
          </CreateFormBlock>
        </TabPanel>
      </TabView>
    </template>
  </PageHeadingBlock>
</template>

<script setup>
  import CreateFormBlock from '@/templates/create-form-block/no-header'
  import { useForm, useField } from 'vee-validate'
  import * as yup from 'yup'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import InputText from 'primevue/inputtext'
  import Divider from 'primevue/divider'
  import PageHeadingBlock from '@/templates/page-heading-block-tabs'

  import { ref } from 'vue'

  const props = defineProps({
    createEdgeFunctionsService: {
      type: Function,
      required: true
    }
  })

  const editorOptions = {
    tabSize: 2,
    formatOnPaste: true
  }

  const validationSchema = yup.object({
    name: yup.string().required()
  })

  const ARGS_INITIAL_STATE = '{}'

  const { defineInputBinds, errors, meta, resetForm, values } = useForm({
    validationSchema,
    initialValues: {
      name: '',
      active: true,
      language: 'javascript',
      code: `'Type your code here...'`,
      jsonArgs: ARGS_INITIAL_STATE
    }
  })

  const name = defineInputBinds('name', { validateOnInput: true })
  const { value: jsonArgs, setValue: setArgs } = useField('jsonArgs')
  const { value: code } = useField('code')

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

  const previewIframe = ref(null)
  const previewIframeArguments = ref(null)

  const postPreviewUpdates = () => {
    if (previewIframe.value && previewIframe.value.contentWindow) {
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

    if (previewIframeArguments.value && previewIframeArguments.value.contentWindow) {
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
</script>
