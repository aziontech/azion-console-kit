<script setup>
  import { ref, computed } from 'vue'
  import { useAccountStore } from '@/stores/account'
  defineEmits(['handleCopy'])

  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import PrimeButton from 'primevue/button'
  const defaultTagCode = ref(`<script>
    if (typeof window.addEventListener === 'function') {
      window.addEventListener('load', function() {
        if (window.azpulse === undefined) {
          var pulse = document.createElement('script');
          pulse.src = '//client.azionrum.net/8900e/azion-pulse.js';
          document.body.appendChild(pulse);
        }
      })
    }
  <${'/'}script>`)

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
    title="Default Tag"
    description="The script waits until the loading event is completed before downloading and running the RUM Client. The loading event isn’t interrupted and doesn’t affect the user experience."
  >
    <template #inputs>
      <div>
        <div class="flex flex-col gap-2">
          <vue-monaco-editor
            v-model:value="defaultTagCode"
            language="javascript"
            :theme="theme"
            :options="editorOptions"
            class="min-h-[200px] overflow-clip surface-border border rounded-md p-disabled"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Cannot edit in read-only editor
          </small>
        </div>
      </div>
      <div>
        <PrimeButton
          label="Copy"
          icon="pi pi-copy"
          class="max-md:w-full"
          @click="$emit('handleCopy', { code: defaultTagCode })"
          outlined
        />
      </div>
    </template>
  </FormHorizontal>
</template>
