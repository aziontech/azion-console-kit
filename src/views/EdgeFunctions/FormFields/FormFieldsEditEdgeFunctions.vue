<script setup>
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldTextIcon from '@/templates/form-fields-inputs/fieldTextIcon'
  import Splitter from 'primevue/splitter'
  import SplitterPanel from 'primevue/splitterpanel'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'
  import CodeEditor from '../components/code-editor.vue'
  import CodePreview from '../components/code-preview.vue'
  import { useField } from 'vee-validate'
  import { computed, ref, watch } from 'vue'

  defineProps(['previewData', 'run'])
  const emit = defineEmits(['update:previewData', 'update:run', 'update:name'])

  const SPLITTER_PROPS = {
    height: '50vh',
    layout: 'horizontal',
    panelsSizes: [66, 34]
  }
  const ARGS_INITIAL_STATE = '{}'

  const previewState = ref(true)

  const { value: name } = useField('name')

  const { value: isProprietaryCode } = useField('isProprietaryCode')
  const { value: defaultArgs, errorMessage: argsError } = useField('defaultArgs')
  const { value: code, errorMessage: codeError } = useField('code')
  const { value: runtime } = useField('runtime')
  const { value: runtimeFormat } = useField('runtimeFormat')

  const showPreview = computed(() => {
    return previewState.value && runtime.value !== 'azion_lua'
  })

  let initialCodeValue = ''
  let initialJsonArgsValue = ARGS_INITIAL_STATE

  const unwatch = watch(name, () => {
    initialCodeValue = code.value
    initialJsonArgsValue = defaultArgs.value

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
      <Splitter
        :style="{ height: SPLITTER_PROPS.height }"
        class="mt-8 surface-border border rounded-md hidden md:flex"
        @resizestart="previewState = false"
        @resizeend="previewState = true"
        :layout="SPLITTER_PROPS.layout"
      >
        <SplitterPanel :size="SPLITTER_PROPS.panelsSizes[0]">
          <CodeEditor
            v-model="defaultArgs"
            :initialValue="initialJsonArgsValue"
            runtime="json"
            :errors="hasArgsError"
          />
        </SplitterPanel>

        <SplitterPanel
          v-if="showPreview"
          :size="SPLITTER_PROPS.panelsSizes[1]"
        >
          <CodePreview :updateObject="updateObject" />
        </SplitterPanel>
      </Splitter>
      <div class="flex flex-col mt-8 surface-border border rounded-md md:hidden h-[50vh]">
        <CodeEditor
          v-model="defaultArgs"
          :initialValue="initialJsonArgsValue"
          runtime="json"
          :errors="hasArgsError"
        />
      </div>
    </TabPanel>
  </TabView>
</template>
