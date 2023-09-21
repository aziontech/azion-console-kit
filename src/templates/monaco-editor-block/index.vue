<template>
  <div
    :class="customClass"
    id="editor"
    ref="editor"
  ></div>
</template>

<script>
  import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
  import { ref, onMounted, watch } from 'vue'

  export default {
    name: 'monaco-editor-block',
    props: {
      code: String,
      language: String,
      customClass: String
    },
    setup(props) {
      const editor = ref(null)

      onMounted(() => {
        const monacoEditor = monaco.editor.create(editor.value, {
          value: props.code,
          minimap: { enabled: false },
          language: props.language || 'python',
          automaticLayout: true,
          readOnly: true,
          overviewRulerLanes: 100,
          formatOnType: true,
          theme: 'vs-dark',
          fixedOverflowWidgets: true,
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
            handleMouseWheel: false
          },
          wordWrap: 'on'
        })

        watch(
          () => props.code,
          (newCode) => {
            monacoEditor.setValue(newCode)
          }
        )
      })

      return {
        editor
      }
    }
  }
</script>
