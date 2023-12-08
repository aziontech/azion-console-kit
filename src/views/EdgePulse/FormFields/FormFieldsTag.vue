<script setup>
  import { ref, computed } from 'vue'
  import { useAccountStore } from '@/stores/account'
  defineEmits(['handleCopy'])

  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import PrimeButton from 'primevue/button'
  const preLoadingTagCode = ref(
    `<script async src="//client.azionrum.net/8900e/azion-pulse.js"><${'/'}script>`
  )

  const editorOptions = ref({
    minimap: { enabled: false },
    readOnly: true,
    scrollBeyondLastLine: false
  })

  const store = useAccountStore()

  const theme = computed(() => {
    return store.currentTheme === 'light' ? 'vs' : 'vs-dark'
  })
</script>

<template>
  <FormHorizontal
    title="Pre-loading Tag"
    description="If you're using Content Security Policy settings preventing the use of inline JavaScript
            then place this tag just before the enclosing BODY tag. This script executes before the
            load event has fired."
  >
    <template #inputs>
      <vue-monaco-editor
        v-model:value="preLoadingTagCode"
        language="javascript"
        :theme="theme"
        :options="editorOptions"
        class="min-h-[56px] surface-border overflow-clip border rounded-md"
      />
      <div>
        <PrimeButton
          icon="pi pi-copy"
          label="Copy to Clipboard"
          class="max-md:w-full"
          outlined
          @click="$emit('handleCopy', { code: preLoadingTagCode })"
        />
      </div>
    </template>
  </FormHorizontal>
</template>
