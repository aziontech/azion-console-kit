<template>
  <div
    id="editableDiv"
    ref="editable"
    contenteditable
    placeholder="Filter using Azion Query Language syntax..."
    class="p-inputtext font-normal text-sm w-full h-auto whitespace-pre font-code min-h-9 max-h-24 min-w-0 overflow-x-hidden overflow-y-auto empty:before:content-[attr(placeholder)] empty:before:block empty:before:text-[color:var(--input-placeholder-text-color)] empty:before:whitespace-nowrap empty:before:overflow-hidden empty:before:text-ellipsis empty:before:pointer-events-none"
    @input="handleInput"
    @keyup="updateCursorOffset"
    @mouseup="updateCursorOffset"
    @focus="updateCursorOffset"
    v-on="$attrs"
  />
</template>

<script setup>
  import { ref, watch, nextTick } from 'vue'
  import Aql from './azion-query-language.js'

  const AzionQueryLanguage = new Aql()

  const props = defineProps({
    modelValue: {
      type: String,
      default: ''
    },
    handleQuery: {
      type: Function,
      required: true
    }
  })

  const emit = defineEmits(['update:modelValue'])

  const editable = ref(null)
  const cursorOffset = ref(null)
  const isInternalUpdate = ref(false)

  const updateCursorOffset = () => {
    cursorOffset.value = AzionQueryLanguage.saveCursorPosition(editable.value)
  }

  const handleInput = (event) => {
    updateCursorOffset()

    const newValue = event.target.innerText
    // highlightQuerySyntax HTML-escapes all user text and emits only fixed
    // <span>/&nbsp; markup, so the assignment is safe.
    // eslint-disable-next-line no-unsanitized/property, xss/no-mixed-html
    editable.value.innerHTML = AzionQueryLanguage.highlightQuerySyntax(newValue)
    isInternalUpdate.value = true
    emit('update:modelValue', newValue)
    props.handleQuery()
    restoreCursorPosition()
  }

  const restoreCursorPosition = (lastOffset = false) => {
    nextTick(() => {
      if (editable.value) {
        if (lastOffset) {
          AzionQueryLanguage.positionCursorAtEndOfElement(editable.value)
          return
        }
        AzionQueryLanguage.restoreCursorPosition(editable.value, cursorOffset.value)
      }
    })
  }

  watch(
    () => props.modelValue,
    (newVal) => {
      // Skip when the change came from our own handleInput — innerHTML is already set
      // and cursor position is being restored. Re-setting innerHTML would destroy the cursor.
      if (isInternalUpdate.value) {
        isInternalUpdate.value = false
        return
      }
      if (editable.value) {
        // highlightQuerySyntax HTML-escapes all user text and emits only fixed
        // <span>/&nbsp; markup, so the assignment is safe.
        // eslint-disable-next-line no-unsanitized/property, xss/no-mixed-html
        editable.value.innerHTML = AzionQueryLanguage.highlightQuerySyntax(newVal)
      }
    }
  )

  defineExpose({
    restoreCursorPosition,
    getCursorOffset: () => cursorOffset.value
  })
</script>
