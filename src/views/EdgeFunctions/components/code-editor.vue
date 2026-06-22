<script setup>
  import { watch, computed, ref } from 'vue'
  import { useThemeStore } from '@/stores/theme'
  import { useVersionContext } from '@/composables/versioning/use-version-context'

  const emit = defineEmits(['update:modelValue'])
  const props = defineProps({
    modelValue: String,
    initialValue: String,
    minimap: {
      type: Boolean,
      default: true
    },
    readOnly: {
      type: Boolean,
      default: false
    },
    runtime: {
      type: String,
      default: 'javascript',
      validator: (value) => {
        return ['javascript', 'json', 'lua'].includes(value)
      }
    },
    errors: Boolean
  })

  const code = ref(props.initialValue)

  // Effective read-only: explicit prop OR immutable version state.
  // Outside the VersionShell the context default is false, so non-versioned usage is unchanged.
  const { readOnly: versionReadOnly } = useVersionContext()
  const isReadOnly = computed(() => props.readOnly || Boolean(versionReadOnly.value))

  const EDITOR_OPTIONS = computed(() => ({
    minimap: { enabled: props.minimap },
    tabSize: 2,
    formatOnPaste: true,
    readOnly: isReadOnly.value
  }))

  const store = useThemeStore()
  const theme = computed(() => {
    return store.resolvedTheme === 'light' ? 'vs' : 'vs-dark'
  })

  watch(
    () => props.modelValue,
    (modelValue) => (code.value = modelValue)
  )
</script>

<template>
  <vue-monaco-editor
    v-model:value="code"
    :language="runtime"
    :theme="theme"
    class="w-full min-h-[390px] h-full border surface-border border-r rounded-md"
    :class="{
      'border-transparent': !errors,
      '!border-red-500 border h-[calc(100%-1.5rem)]': errors,
      'cursor-not-allowed': isReadOnly
    }"
    :options="EDITOR_OPTIONS"
    @change="emit('update:modelValue', $event)"
  />
</template>
