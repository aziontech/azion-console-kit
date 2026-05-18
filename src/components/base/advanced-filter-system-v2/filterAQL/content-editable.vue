<template>
  <div
    id="editableDiv"
    ref="editable"
    contenteditable
    placeholder="Filter using Azion Query Language syntax..."
    class="contenteditable p-inputtext font-normal text-sm w-full h-auto"
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
        editable.value.innerHTML = AzionQueryLanguage.highlightQuerySyntax(newVal)
      }
    }
  )

  defineExpose({
    restoreCursorPosition,
    getCursorOffset: () => cursorOffset.value
  })
</script>

<style>
  .contenteditable {
    white-space: pre-wrap;
    font-family:
      ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
    min-height: 2.25rem;
    max-height: 6rem;
    overflow-y: auto;
  }

  .contenteditable:empty:before {
    content: attr(placeholder);
    color: var(--input-placeholder-text-color);
    pointer-events: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
  }
</style>
