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
    description="The script executes before the load event is fired. Recommended when using Content Security Policy settings that prevent the use of inline JavaScript."
  >
    <template #inputs>
      <div>
        <div class="flex flex-col gap-2">
          <vue-monaco-editor
            v-model:value="preLoadingTagCode"
            language="javascript"
            :theme="theme"
            :options="editorOptions"
            class="min-h-[56px] surface-border overflow-clip border rounded-md p-disabled"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Cannot edit in read-only editor
          </small>
        </div>
      </div>
      <div>
        <PrimeButton
          icon="pi pi-copy"
          label="Copy"
          class="max-md:w-full"
          outlined
          @click="$emit('handleCopy', { code: preLoadingTagCode })"
        />
      </div>
    </template>
  </FormHorizontal>
</template>
