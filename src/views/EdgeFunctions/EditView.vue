<template>
  <EditFormBlock
    pageTitle="Edit Edge Functions"
    :editService="props.editEdgeFunctionsService"
    :loadService="props.loadEdgeFunctionsService"
    :initialDataSetter="setValues"
    :isValid="meta.valid"
    :formData="values"
    :navigationItems="navigationItems"
  >
    <template #raw-form>
      <div class="flex flex-col md:flex-row">
        <div class="w-full md:w-1/2">
          <TabPanel
            header="Code"
            v-if="tabActive === 0"
          >
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
          </TabPanel>
          <TabPanel
            header="Arguments"
            v-if="tabActive === 1"
          >
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
          </TabPanel>
        </div>

        <div class="hidden md:block">
          <divider layout="vertical" />
        </div>

        <div class="w-full md:w-1/2 hidden md:block">
          <div class="relative overflow-hidden h-full p-5">
            <iframe
              class="w-full h-full border-0 overflow-hidden"
              ref="previewIframe"
              @load="postPreviewUpdates"
              frameborder="0"
              allowfullscreen
              src="https://code-preview.azion.com/preview"
              title="preview"
              sandbox="allow-scripts"
            ></iframe>
          </div>
        </div>
      </div>
    </template>
  </EditFormBlock>
</template>

<script setup>
  import EditFormBlock from '@/templates/edit-form-block/with-tabs'
  import { useForm, useField } from 'vee-validate'
  import * as yup from 'yup'
  import TabPanel from 'primevue/tabpanel'
  import InputText from 'primevue/inputtext'
  import Divider from 'primevue/divider'

  import { ref, watch } from 'vue'

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

  document.addEventListener('tabChange', (event) => {
    tabActive.value = event.detail.tab
  })

  const navigationItems = [
    { label: 'Code', route: 'code' },
    { label: 'Arguments', route: 'arguments' }
  ]

  const editorOptions = {
    tabSize: 2,
    formatOnPaste: true
  }

  const validationSchema = yup.object({
    name: yup.string().required()
  })
  const ARGS_INITIAL_STATE = '{}'

  const { setValues, defineInputBinds, errors, meta, values } = useForm({
    validationSchema,
    initialValues: {
      name: '',
      active: true,
      code: `'Type your code here...'`,
      jsonArgs: ARGS_INITIAL_STATE,
      tabActive: 0
    }
  })

  const name = defineInputBinds('name', { validateOnInput: true })

  const { value: jsonArgs, setValue: setArgs } = useField('jsonArgs')
  const { value: code } = useField('code')
  const { value: tabActive } = useField('tabActive')

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

  const postPreviewUpdates = () => {
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

  let initialLoad = false
  watch(code, () => {
    if (!initialLoad) {
      postPreviewUpdates()
      initialLoad = true
    }
  })
</script>
