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

  const { value: jsonArgs, errorMessage: jsonArgsError } = useField('jsonArgs', null, {
    initialValue: ARGS_INITIAL_STATE
  })
  const { value: code, errorMessage: codeError } = useField('code', null, {
    initialValue: HelloWorldSample
  })

  const hasCodeError = computed(() => {
    return !!codeError.value
  })

  const hasArgsError = computed(() => {
    return !!jsonArgsError.value
  })

  const updateObject = computed(() => {
    const previewValues = {
      code: code.value,
      args: jsonArgs.value
    }
    emit('update:previewData', previewValues)
    return previewValues
  })

  const initiatorTypeOptions = [
    {
      title: 'Edge Application',
      subtitle: 'Functions are executed at the edge to reduce latency and enhance performance.',
      inputValue: 'edge_application'
    },
    {
      title: 'Edge Firewall',
      subtitle: 'Functions are executed by a firewall to apply security policies.',
      inputValue: 'edge_firewall'
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
        description="Create edge functions that run closer to users to use with Edge Application or Edge Firewall."
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
        title="Language"
        :isDrawer="isDrawer"
        description="The language the edge function is written in."
      >
        <template #inputs>
          <div class="flex flex-col w-full sm:max-w-lg gap-2">
            <FieldTextIcon
              label="Language"
              name="LANGUAGE_LABEL"
              icon="pi pi-lock"
              :value="LANGUAGE_LABEL"
              description="Currently, only JavaScript is supported."
              readonly
            />
          </div>
        </template>
      </FormHorizontal>

      <FormHorizontal
        v-if="!isDrawer"
        class="mt-8"
        title="Initiator Type"
        description="Define the source or trigger that executes the edge function."
      >
        <template #inputs>
          <div class="flex flex-col w-full gap-2">
            <FieldGroupRadio
              required
              nameField="initiatorType"
              isCard
              :options="initiatorTypeOptions"
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
            language="javascript"
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
          language="javascript"
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
            v-model="jsonArgs"
            :initialValue="ARGS_INITIAL_STATE"
            language="json"
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
          v-model="jsonArgs"
          :initialValue="ARGS_INITIAL_STATE"
          language="json"
          :errors="hasArgsError"
        />
      </div>
    </TabPanel>
  </TabView>
</template>
