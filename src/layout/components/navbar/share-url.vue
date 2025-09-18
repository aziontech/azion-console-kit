<template>
  <Button
    type="button"
    icon="pi pi-share-alt"
    size="small"
    label=""
    @click="toggle"
    outlined
  />

  <OverlayPanel ref="overlayPanel">
    <div class="flex flex-column gap-4 w-25rem">
      <div class="flex flex-column gap-4">
        <p class="text-sm text-900 block mb-2">
          Share this link to provide direct access to this drawer. It allows users to quickly
          navigate to the specific configuration.
        </p>

        <div class="w-full">
          <strong class="text-color text-sm text-900 block mb-2"> Direct link </strong>
          <InputText
            readonly
            :value="url"
            class="w-full"
          />
        </div>
        <div>
          <Button
            outlined
            icon="pi pi-copy"
            size="small"
            label="Copy link"
            @click="copyToClipboard"
          />
        </div>
      </div>
    </div>
  </OverlayPanel>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import Button from 'primevue/button'
  import InputText from 'primevue/inputtext'
  import OverlayPanel from 'primevue/overlaypanel'

  const overlayPanel = ref()
  const url = computed(() => window.location.href)

  const toggle = (event) => {
    overlayPanel.value.toggle(event)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url.value)
  }
</script>
