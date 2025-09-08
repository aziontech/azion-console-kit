<script setup>
  import Splitter from 'primevue/splitter'
  import SplitterPanel from 'primevue/splitterpanel'
  import TabView from 'primevue/tabview'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldTextIcon from '@/templates/form-fields-inputs/fieldTextIcon'
  import TabPanel from 'primevue/tabpanel'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import CodeEditor from '../components/code-editor.vue'
  import CodePreview from '../components/code-preview.vue'
  import HelloWorldSample from '@/helpers/edge-function-hello-world'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'

  import { computed, ref } from 'vue'
  import { useField } from 'vee-validate'

  defineProps({
    isDrawer: {
      type: Boolean,
      default: false
    },
    previewData: {
      type: Object
    }
  })

  const emit = defineEmits(['update:previewData'])

  const SPLITTER_PROPS = {
    height: '50vh',
    layout: 'horizontal',
    panelsSizes: [66, 34]
  }

  const ARGS_INITIAL_STATE = '{}'
  const LANGUAGE_LABEL = 'JavaScript'
  const showPreview = ref(true)

  const { value: name } = useField('name')

  const { value: defaultArgs, errorMessage: argsError } = useField('defaultArgs', null, {
    initialValue: ARGS_INITIAL_STATE
  })
  const { value: code, errorMessage: codeError } = useField('code', null, {
    initialValue: HelloWorldSample
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
    return previewValues
  })

  const executionEnvironmentOptions = [
    {
      title: 'Application',
      subtitle: 'Functions are executed at the edge to reduce latency and enhance performance.',
      inputValue: 'application'
    },
    {
      title: 'Firewall',
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
        :isDrawer="isDrawer"
        title="General"
        description="Create functions that run closer to users to use with Application or Firewall."
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
        :isDrawer="isDrawer"
        description="The execution runtime used to run your function"
      >
        <template #inputs>
          <div class="flex flex-col w-full sm:max-w-lg gap-2">
            <FieldTextIcon
              label="Runtime"
              name="LANGUAGE_LABEL"
              icon="pi pi-lock"
              disabled
              :value="LANGUAGE_LABEL"
              description="Currently, only JavaScript is supported."
            />
          </div>
        </template>
      </FormHorizontal>

      <FormHorizontal
        v-if="!isDrawer"
        class="mt-8"
        title="Execution Environment"
        description="Specify the execution environment for your function"
      >
        <template #inputs>
          <div class="flex flex-col w-full gap-2">
            <FieldGroupRadio
              required
              nameField="executionEnvironment"
              isCard
              :options="executionEnvironmentOptions"
            />
          </div>
        </template>
      </FormHorizontal>

      <FormHorizontal
        class="mt-8"
        title="Status"
        :isDrawer="isDrawer"
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
            :initialValue="HelloWorldSample"
            runtime="javascript"
            :errors="hasCodeError"
          />
          <small
            v-if="codeError"
            class="p-error text-xs font-normal"
          >
            {{ codeError }}
          </small>
        </SplitterPanel>

        <SplitterPanel :size="SPLITTER_PROPS.panelsSizes[1]">
          <CodePreview
            v-if="showPreview"
            :updateObject="updateObject"
          />
        </SplitterPanel>
      </Splitter>

      <div class="flex flex-col mt-8 surface-border border rounded-md gap-2 md:hidden h-[50vh]">
        <CodeEditor
          v-model="code"
          :initialValue="HelloWorldSample"
          runtime="javascript"
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
        @resizestart="showPreview = false"
        @resizeend="showPreview = true"
        :layout="SPLITTER_PROPS.layout"
      >
        <SplitterPanel :size="SPLITTER_PROPS.panelsSizes[0]">
          <CodeEditor
            v-model="defaultArgs"
            :initialValue="ARGS_INITIAL_STATE"
            runtime="json"
            :errors="hasArgsError"
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
          v-model="defaultArgs"
          :initialValue="ARGS_INITIAL_STATE"
          runtime="json"
          :errors="hasArgsError"
        />
      </div>
    </TabPanel>
  </TabView>
</template>
