<template>
  <InfoDrawerBlock
    v-model:visible="definitionDrawerVisible"
    :title="selectedTable?.key ? `SQL Definition: ${selectedTable.key}` : 'SQL Definition'"
  >
    <template #body>
      <div class="w-full flex flex-col gap-8 max-md:gap-6">
        <div
          v-if="isLoadingDefinition"
          class="w-full"
        >
          <div class="flex flex-col gap-8 max-md:gap-6">
            <div
              class="max-w-screen-3xl mx-auto gap-4 w-full surface-section rounded-md border surface-border p-3 sm:p-8 flex-wrap min-w-[2rem]"
            >
              <div class="flex items-center gap-3 mb-4">
                <Skeleton class="w-32 h-6" />
              </div>
              <div class="flex justify-content-between align-items-center w-full">
                <Skeleton class="w-40 h-6 rounded-full" />
                <Skeleton class="w-32 h-8 rounded" />
              </div>
            </div>

            <div
              class="max-w-screen-3xl mx-auto gap-4 w-full surface-section rounded-md border surface-border p-3 sm:p-8 flex-wrap min-w-[2rem]"
            >
              <Skeleton class="w-40 h-6 mb-4" />
              <div class="bg-surface-50 dark:bg-surface-800 border-round-lg p-4">
                <div class="flex flex-col gap-2">
                  <Skeleton class="w-48 h-4" />
                  <Skeleton class="w-full h-4" />
                  <Skeleton class="w-56 h-4" />
                  <Skeleton class="w-40 h-4" />
                  <Skeleton class="w-64 h-4" />
                  <Skeleton class="w-32 h-4" />
                  <Skeleton class="w-24 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-else-if="selectedTableDefinition"
          class="w-full flex flex-col gap-4"
        >
          <InfoSection
            :title="selectedTable?.key || 'Table'"
            :loading="false"
            hideDivider
          >
            <template #body>
              <div class="flex justify-content-between align-items-center w-full">
                <div class="flex align-items-center gap-2">
                  <Tag
                    icon="pi pi-code"
                    value="CREATE TABLE Statement"
                    severity="info"
                  />
                </div>
                <copyBlock
                  :value="selectedTableDefinition"
                  label="Copy Definition"
                />
              </div>
            </template>
          </InfoSection>

          <InfoSection
            title="CREATE TABLE Statement"
            :loading="false"
          >
            <template #body>
              <div
                v-if="selectedTableDefinition"
                class="sql-definition-display border-round-lg border-1 surface-border overflow-hidden w-full bg-surface-ground"
              >
                <div
                  class="sql-definition-header p-2 border-bottom-1 surface-border bg-surface-50 dark:bg-surface-800 flex justify-content-between align-items-center"
                >
                  <span class="text-xs text-color-secondary font-mono">SQLite</span>
                  <copyBlock :value="selectedTableDefinition" />
                </div>
                <div
                  class="sql-monaco-container border-round-lg overflow-hidden"
                  style="height: 350px"
                >
                  <vue-monaco-editor
                    :key="selectedTableDefinition"
                    :value="selectedTableDefinition"
                    language="sql"
                    :theme="monacoTheme"
                    :options="sqlMonacoOptions"
                    class="w-full h-full"
                  />
                </div>
              </div>
              <div
                v-else
                class="flex items-center justify-center h-24 text-color-secondary"
              >
                <i class="pi pi-spin pi-spinner mr-2"></i>
                Loading definition...
              </div>
            </template>
          </InfoSection>
        </div>

        <div
          v-else
          class="flex flex-col items-center justify-center p-8 text-center"
        >
          <i class="pi pi-code text-6xl text-primary mb-4 opacity-50"></i>
          <h4 class="text-lg font-medium text-color mb-2">No definition loaded</h4>
          <p class="text-color-secondary">
            Select a table and click "View Definition" from the menu to view its CREATE TABLE
            statement
          </p>
        </div>
      </div>
    </template>
  </InfoDrawerBlock>
</template>
<script setup>
  import InfoDrawerBlock from '@/templates/info-drawer-block'
  import InfoSection from '@/templates/info-drawer-block/info-section'
  import Tag from 'primevue/tag'
  import Skeleton from 'primevue/skeleton'
  import copyBlock from '@/templates/copy-block/copy-block.vue'
  import { ref, watch } from 'vue'
  import { computed } from 'vue'

  import { useAccountStore } from '@/stores/account'

  const props = defineProps({
    selectedTable: {
      type: Object,
      required: true
    },
    selectedTableDefinition: {
      type: String,
      required: true
    },
    isLoadingDefinition: {
      type: Boolean,
      required: true
    },
    definitionVisible: {
      type: Boolean,
      required: true
    }
  })

  const emit = defineEmits(['close'])
  const accountStore = useAccountStore()

  const sqlMonacoOptions = {
    readOnly: true,
    minimap: { enabled: false },
    tabSize: 2,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    fontSize: 14,
    lineNumbers: 'on',
    folding: false,
    glyphMargin: false,
    lineDecorationsWidth: 6,
    lineNumbersMinChars: 3,
    renderLineHighlight: 'none',
    padding: { top: 10, bottom: 10 },
    wordWrap: 'on',
    contextmenu: false,
    selectOnLineNumbers: false,
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    overviewRulerBorder: false,
    rulers: [],
    bracketPairColorization: { enabled: false },
    matchBrackets: 'never',
    renderIndentGuides: false,
    guides: {
      indentation: false,
      bracketPairs: false,
      bracketPairsHorizontal: false,
      highlightActiveIndentation: false
    },
    scrollbar: {
      vertical: 'hidden',
      horizontal: 'hidden'
    }
  }

  const monacoTheme = computed(() => {
    return accountStore.currentTheme === 'light' ? 'vs' : 'vs-dark'
  })

  const definitionDrawerVisible = ref(false)

  watch(
    () => props.definitionVisible,
    (newVal) => {
      definitionDrawerVisible.value = newVal
    }
  )

  watch(
    () => definitionDrawerVisible.value,
    (newVal) => {
      if (!newVal) {
        emit('close')
      }
    }
  )
</script>
