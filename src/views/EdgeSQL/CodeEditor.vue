<template>
  <div class="flex mt-4">
    <div class="flex flex-col w-80">
      <span class="text-sm">List tables</span>
    </div>
    <div class="w-full">
      <Splitter
        :pt="{ root: { 'data-testid': 'code-editor', class: 'border-none' } }"
        layout="vertical"
        style="height: calc(100vh - 250px)"
        @resizeend="onResizeEnd"
      >
        <SplitterPanel
          class="h-full"
          :size="editorPanelSize"
          :minSize="20"
          :pt="{ root: { 'data-testid': 'code-editor__panel__editor' } }"
        >
          <div class="flex flex-col h-full">
            <div class="flex justify-between border-1 border surface-border h-12 rounded-t-md p-2">
              <Button
                label="Run Query"
                icon="pi pi-play"
                severity="primary"
              />

              <div class="flex gap-2">
                <Button
                  label="Table Reference"
                  icon="pi pi-table"
                  severity="secondary"
                  outlined
                />
                <Button
                  label="Prettify"
                  icon="pi pi-align-left"
                  outlined
                  severity="secondary"
                />
                <Button
                  label="Templates"
                  icon="pi pi-bolt"
                  severity="secondary"
                  outlined
                />
              </div>
            </div>
            <div class="flex-1 min-h-0">
              <vue-monaco-editor
                :key="`editor-${editorPanelSize}`"
                v-model:value="sqlQueryCommand"
                language="sql"
                :theme="monacoTheme"
                :options="{ ...monacoOptions, readOnly: isExecutingQuery }"
                class="w-full h-full"
              />
            </div>
          </div>
        </SplitterPanel>
        <SplitterPanel
          :size="100 - editorPanelSize"
          :minSize="20"
          :pt="{ root: { 'data-testid': 'code-editor__panel__console' } }"
        >
          <h3>Console</h3>
        </SplitterPanel>
      </Splitter>
    </div>
  </div>
</template>

<script setup>
  import Splitter from 'primevue/splitter'
  import SplitterPanel from 'primevue/splitterpanel'
  import Button from 'primevue/button'
  import { ref } from 'vue'

  defineOptions({ name: 'code-editor' })

  const sqlQueryCommand = ref('')

  const monacoTheme = 'vs-dark'

  const monacoOptions = {}

  const isExecutingQuery = ref(false)

  const editorPanelSize = ref(70) // percentage height of editor panel

  const onResizeEnd = (event) => {
    // event.sizes is an array of panel sizes in percentages
    if (Array.isArray(event?.sizes) && event.sizes.length > 0) {
      editorPanelSize.value = event.sizes[0]
    }
  }
</script>
