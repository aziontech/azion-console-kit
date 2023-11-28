<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edit Edge Function" />
    </template>
    <template #content>
      <EditFormBlock
        :editService="props.editEdgeFunctionsService"
        :loadService="props.loadEdgeFunctionsService"
        :initialDataSetter="setValues"
        :formData="values"
        :formMeta="meta"
        :hasTabs="true"
        :updatedRedirect="updatedRedirect"
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
                        v-model="langLabel"
                        id="language"
                        type="text"
                        class="w-full text-[var(--text-color-secondary)]"
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
                    <InputSwitch
                      v-model="active"
                      id="active"
                    />
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
              <Splitter
                :style="{ height: getSplitterHeight }"
                class="mt-8 surface-border border rounded-md"
                @resizestart="showPreview = false"
                @resizeend="showPreview = true"
                :layout="getSplitterLayout"
              >
                <SplitterPanel
                  :size="getSplitterPanelSize[0]"
                  class="flex flex-col h-full gap-2"
                >
                  <CodeEditor
                    v-model="code"
                    :initialValue="initialCodeValue"
                    language="javascript"
                    :errors="!!errors.code"
                  />
                  <small
                    v-if="errors.code"
                    class="p-error text-xs font-normal"
                  >
                    {{ errors.code }}
                  </small>
                </SplitterPanel>

                <SplitterPanel :size="getSplitterPanelSize[1]">
                  <CodePreview
                    v-if="showPreview"
                    :updateObject="updateObject"
                  />
                </SplitterPanel>
              </Splitter>
            </TabPanel>

            <TabPanel header="Arguments">
              <Splitter
                :style="{ height: getSplitterHeight }"
                class="mt-8 surface-border border rounded-md"
                @resizestart="showPreview = false"
                @resizeend="showPreview = true"
                :layout="getSplitterLayout"
              >
                <SplitterPanel :size="getSplitterPanelSize[0]">
                  <CodeEditor
                    v-model="jsonArgs"
                    :initialValue="initialJsonArgsValue"
                    language="json"
                    :errors="!!errors.jsonArgs"
                  />
                </SplitterPanel>

                <SplitterPanel :size="getSplitterPanelSize[1]">
                  <CodePreview
                    v-if="showPreview"
                    :updateObject="updateObject"
                  />
                </SplitterPanel>
              </Splitter>
            </TabPanel>
          </TabView>
        </template>
      </EditFormBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import { useForm, useField } from 'vee-validate'
  import * as yup from 'yup'
  import { useWindowSize } from '@/helpers'
  import InputText from 'primevue/inputtext'
  import InputSwitch from 'primevue/inputswitch'
  import Splitter from 'primevue/splitter'
  import SplitterPanel from 'primevue/splitterpanel'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import ContentBlock from '@/templates/content-block'
  import EditFormBlock from '@/templates/edit-form-block-new'
  import FormHorizontal from '@/templates/create-form-block-new/form-horizontal'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import CodeEditor from './components/code-editor.vue'
  import CodePreview from './components/code-preview.vue'

  const props = defineProps({
    loadEdgeFunctionsService: {
      type: Function,
      required: true
    },
    editEdgeFunctionsService: {
      type: Function,
      required: true
    },
    updatedRedirect: {
      type: String,
      required: true
    }
  })

  const TAILWIND_MD_BREAKPOINT = 768
  const { width } = useWindowSize()

  const getSplitterLayout = computed(() => {
    return width.value > TAILWIND_MD_BREAKPOINT ? 'horizontal' : 'vertical'
  })

  const getSplitterHeight = computed(() => {
    return width.value > TAILWIND_MD_BREAKPOINT ? '50vh' : '800px'
  })

  const getSplitterPanelSize = computed(() => {
    return width.value > TAILWIND_MD_BREAKPOINT ? [66, 34] : [50, 50]
  })

  const showPreview = ref(true)

  const ARGS_INITIAL_STATE = '{}'

  const validationSchema = yup.object({
    name: yup.string().required('Name is a required field'),
    code: yup.string().required('Code is a required field'),
    jsonArgs: yup.string().test('empty', '', (value) => {
      if (!value) setArgs(ARGS_INITIAL_STATE)
      return true
    })
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

  const name = defineInputBinds('name')
  const { value: jsonArgs, setValue: setArgs } = useField('jsonArgs')
  const { value: code } = useField('code')
  const { value: language } = useField('language')
  const { value: active } = useField('active')

  let initialCodeValue = ''
  let initialJsonArgsValue = ARGS_INITIAL_STATE
  const unwatch = watch(values, () => {
    initialCodeValue = code.value
    initialJsonArgsValue = jsonArgs.value

    if (initialCodeValue) {
      unwatch()
    }
  })

  const langLabel = computed(() => {
    const langLabels = {
      javascript: 'JavaScript',
      lua: 'Lua'
    }

    return langLabels[language.value]
  })

  const updateObject = computed(() => {
    return {
      code: code.value,
      args: jsonArgs.value
    }
  })
</script>
