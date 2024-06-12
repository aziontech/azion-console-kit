<script setup>
  import InputText from 'primevue/inputtext'
  import Splitter from 'primevue/splitter'
  import SplitterPanel from 'primevue/splitterpanel'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import CodeEditor from '../components/code-editor.vue'
  import CodePreview from '../components/code-preview.vue'
  import HelloWorldSample from '@/helpers/edge-function-hello-world'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'

  import { computed, ref } from 'vue'
  import { useField } from 'vee-validate'
  defineProps(['previewData'])
  const emit = defineEmits(['update:previewData'])
  const SPLITTER_PROPS = {
    height: '50vh',
    layout: 'horizontal',
    panelsSizes: [66, 34]
  }

  const ARGS_INITIAL_STATE = '{}'
  const LANGUAGE_LABEL = 'JavaScript'
  const showPreview = ref(true)

  const { value: name, errorMessage: nameError } = useField('name')
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
</script>

<template>
  <TabView class="w-full">
    <TabPanel header="Main Settings">
      <FormHorizontal
        class="mt-8"
        title="General"
        description="Create edge functions that run closer to users to use with Edge Application or Edge Firewall."
      >
        <template #inputs>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label
              for="name"
              class="text-color text-base font-medium"
              >Name *</label
            >
            <InputText
              v-model="name"
              id="name"
              type="text"
              :class="{ 'p-invalid': nameError }"
              placeholder="My function"
            />
            <small class="text-xs text-color-secondary font-normal leading-5">
              Give a unique and descriptive name to identify the function.</small
            >
            <small
              v-if="nameError"
              class="p-error text-xs font-normal leading-tight"
              >{{ nameError }}</small
            >
          </div>
        </template>
      </FormHorizontal>

      <FormHorizontal
        class="mt-8"
        title="Language"
        description="The language the edge function is written in."
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
                :value="LANGUAGE_LABEL"
                id="language"
                type="text"
                class="w-full"
                readonly
              />
            </span>
            <small class="text-xs text-color-secondary font-normal leading-5">
              Currently, only JavaScript is supported.</small
            >
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
              subtitle=""
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
