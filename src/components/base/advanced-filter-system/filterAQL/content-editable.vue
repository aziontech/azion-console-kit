<template>
  <div
    id="editableDiv"
    ref="editable"
    contenteditable
    placeholder="Filter using Azion Query Language syntax..."
    class="contenteditable p-inputtext font-normal text-sm w-full h-auto font-mono"
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

  const updateCursorOffset = () => {
    cursorOffset.value = AzionQueryLanguage.saveCursorPosition(editable.value)
  }

  const handleInput = (event) => {
    updateCursorOffset()

    const newValue = event.target.innerText
    AzionQueryLanguage.renderHighlightedSyntax(editable.value, newValue)
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
      if (editable.value) {
        AzionQueryLanguage.renderHighlightedSyntax(editable.value, newVal)
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
  }

  .contenteditable:empty:before {
    content: attr(placeholder);
    color: var(--input-placeholder-text-color);
    pointer-events: none;
  }
</style>
