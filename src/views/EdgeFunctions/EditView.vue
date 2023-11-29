<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edit Edge Function">
        <MobileCodePreview :updateObject="updateObject" />
      </PageHeadingBlock>
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
                :style="{ height: SPLITTER_PROPS.height }"
                class="mt-8 surface-border border rounded-md hidden md:flex"
                @resizestart="showPreview = false"
                @resizeend="showPreview = true"
                :layout="SPLITTER_PROPS.layout"
              >
                <SplitterPanel
                  :size="SPLITTER_PROPS.panelsSizes[0]"
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

                <SplitterPanel :size="SPLITTER_PROPS.panelsSizes[1]">
                  <CodePreview
                    v-if="showPreview"
                    :updateObject="updateObject"
                  />
                </SplitterPanel>
              </Splitter>

              <div
                class="flex flex-col mt-8 surface-border border rounded-md gap-2 md:hidden h-[50vh]"
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
              </div>
            </TabPanel>

            <TabPanel header="Arguments">
              <Splitter
                :style="{ height: SPLITTER_PROPS.height }"
                class="mt-8 surface-border border rounded-md hidden md:flex"
                @resizestart="showPreview = false"
                @resizeend="showPreview = true"
                :layout="SPLITTER_PROPS.layout"
              >
                <SplitterPanel :size="SPLITTER_PROPS.panelsSizes[0]">
                  <CodeEditor
                    v-model="jsonArgs"
                    :initialValue="initialJsonArgsValue"
                    language="json"
                    :errors="!!errors.jsonArgs"
                  />
                </SplitterPanel>

                <SplitterPanel :size="SPLITTER_PROPS.panelsSizes[1]">
                  <CodePreview
                    v-if="showPreview"
                    :updateObject="updateObject"
                  />
                </SplitterPanel>
              </Splitter>
              <div class="flex flex-col mt-8 surface-border border rounded-md md:hidden h-[50vh]">
                <CodeEditor
                  v-model="jsonArgs"
                  :initialValue="initialJsonArgsValue"
                  language="json"
                  :errors="!!errors.jsonArgs"
                />
              </div>
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
  import MobileCodePreview from './components/mobile-code-preview.vue'

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

  const SPLITTER_PROPS = {
    height: '50vh',
    layout: 'horizontal',
    panelsSizes: [66, 34]
  }

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
