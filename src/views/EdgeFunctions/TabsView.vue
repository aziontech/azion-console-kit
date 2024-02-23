<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edit Edge Function">
        <MobileCodePreview :updateObject="updateObject" />
      </PageHeadingBlock>
    </template>
    <template #content>
      <TabView
        :activeIndex="activeTab"
        @tab-click="changeRouteByClickingOnTab"
        class="w-full h-full"
      >
        <TabPanel header="Main Settings">
          <EditView
            :loadEdgeFunctionsService="loadEdgeFunctionsService"
            :editEdgeFunctionsService="editEdgeFunctionsService"
            :updatedRedirect="updatedRedirect"
            :isTab="true"
          />
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
                v-model="dataFormField.code"
                :initialValue="initialCodeValue"
                language="javascript"
                :errors="hasCodeError"
                :readOnly="dataFormField.isProprietaryCode"
              />
              <small
                v-if="dataFormField.codeError"
                class="p-error text-xs font-normal"
              >
                {{ dataFormField.codeError }}
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
              v-model="dataFormField.code"
              :initialValue="initialCodeValue"
              language="javascript"
              :errors="hasCodeError"
            />
            <small
              v-if="dataFormField.codeError"
              class="p-error text-xs font-normal"
            >
              {{ dataFormField.codeError }}
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
              v-model="dataFormField.jsonArgs"
              :initialValue="initialJsonArgsValue"
              language="json"
              :errors="hasArgsError"
            />
          </div>
        </TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>

<script setup>
import { ref, computed, watch, reactive, onMounted } from 'vue'
import ContentBlock from '@/templates/content-block'
import PageHeadingBlock from '@/templates/page-heading-block'
import TabPanel from 'primevue/tabpanel'
import TabView from 'primevue/tabview'
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import CodeEditor from './components/code-editor.vue'
import MobileCodePreview from './components/mobile-code-preview.vue'
import EditView from './EditView.vue'

const emit = defineEmits(['update:previewData'])

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

onMounted(() => {
  loadService()
})

const dataFormField = reactive({
  name: null,
  code: null,
  jsonArgs: null,
  isProprietaryCode: null,
  codeError: null,
  jsonArgsError: null
})

const activeTab = ref(0)
const showPreview = ref(true)

const SPLITTER_PROPS = {
  height: '50vh',
  layout: 'horizontal',
  panelsSizes: [66, 34]
}
const ARGS_INITIAL_STATE = '{}'

let initialCodeValue = ''
let initialJsonArgsValue = ARGS_INITIAL_STATE

const unwatch = watch(dataFormField.name, () => {
  initialCodeValue = dataFormField.code
  initialJsonArgsValue = dataFormField.jsonArgs

  if (initialCodeValue) {
    unwatch()
  }
})

const updateObject = computed(() => {
  const previewValues = {
    code: dataFormField.code,
    args: dataFormField.jsonArgs
  }
  emit('update:previewData', previewValues)
  return previewValues
})

const hasCodeError = computed(() => {
  return !!dataFormField.codeError
})

const hasArgsError = computed(() => {
  return !!dataFormField.jsonArgsError
})

const loadService = async () => {
  try {
    const response = await props.loadEdgeFunctionsService()
  } catch (error) {
    console.log(error)
  }
}
</script>
