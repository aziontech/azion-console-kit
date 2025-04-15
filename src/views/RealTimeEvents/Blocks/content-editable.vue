<template>
  <div
    id="editableDiv"
    ref="editable"
    contenteditable
    placeholder="Azion Query Language"
    class="contenteditable p-inputtext p-2 font-normal text-sm w-full h-auto font-mono"
    @input="handleInput"
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

  const handleInput = (event) => {
    cursorOffset.value = AzionQueryLanguage.saveCursorPosition(editable.value)

    const newValue = event.target.innerText
    editable.value.innerHTML = AzionQueryLanguage.highlightQuerySyntax(newValue)
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
      if (newVal) {
        if (editable.value) {
          editable.value.innerHTML = AzionQueryLanguage.highlightQuerySyntax(newVal)
        }
      }
    }
  )

  defineExpose({
    restoreCursorPosition
  })
</script>

<style>
  .contenteditable {
    white-space: pre-wrap;
  }

  .contenteditable:empty:before {
    content: attr(placeholder);
    color: #aaa;
    pointer-events: none;
  }
</style>
