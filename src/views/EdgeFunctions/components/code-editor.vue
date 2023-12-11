<template>
  <vue-monaco-editor
    v-model:value="code"
    :language="language"
    :theme="theme"
    class="!w-[99%] h-full surface-border border-r"
    :class="{ 'border-red-500 border rounded-md h-[calc(100%-1.5rem)]': errors }"
    :options="EDITOR_OPTIONS"
    @change="emit('update:modelValue', $event)"
  />
</template>

<script setup>
  import { watch, computed, ref } from 'vue'
  import { useAccountStore } from '@/stores/account'

  const EDITOR_OPTIONS = {
    tabSize: 2,
    formatOnPaste: true
  }

  const emit = defineEmits(['update:modelValue'])
  const props = defineProps({
    modelValue: String,
    initialValue: String,
    language: {
      type: String,
      default: 'javascript',
      validator: (value) => {
        return ['javascript', 'json'].includes(value)
      }
    },
    errors: Boolean
  })

  const store = useAccountStore()
  const theme = computed(() => {
    return store.currentTheme === 'light' ? 'vs' : 'vs-dark'
  })

  const code = ref(props.initialValue)

  watch(
    () => props.modelValue,
    (modelValue) => (code.value = modelValue)
  )
</script>
