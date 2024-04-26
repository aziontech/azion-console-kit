<template>
  <vue-monaco-editor
    v-model:value="code"
    :language="language"
    :theme="theme"
    class="!w-[99%] h-full surface-border border-r"
    :class="{
      'border-red-500 border rounded-md h-[calc(100%-1.5rem)]': errors,
      'cursor-not-allowed': EDITOR_OPTIONS.readOnly
    }"
    :options="EDITOR_OPTIONS"
    @change="emit('update:modelValue', $event)"
  />
</template>

<script setup>
  import { watch, computed, ref } from 'vue'
  import { useAccountStore } from '@/stores/account'

  const emit = defineEmits(['update:modelValue'])
  const props = defineProps({
    modelValue: String,
    initialValue: String,
    readOnly: {
      type: Boolean
    },
    language: {
      type: String,
      default: 'javascript',
      validator: (value) => {
        return ['javascript', 'json', 'lua'].includes(value)
      }
    },
    errors: Boolean
  })

  const store = useAccountStore()
  const theme = computed(() => {
    return store.currentTheme === 'light' ? 'vs' : 'vs-dark'
  })

  const code = ref(props.initialValue)
  const EDITOR_OPTIONS = ref({
    tabSize: 2,
    formatOnPaste: true,
    readOnly: props.readOnly
  })

  watch(
    () => props.modelValue,
    (modelValue) => (code.value = modelValue)
  )

  watch(
    () => props.readOnly,
    (value) => (EDITOR_OPTIONS.value.readOnly = value)
  )
</script>
