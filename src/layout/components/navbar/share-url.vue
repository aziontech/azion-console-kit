<template>
  <Button
    type="button"
    icon="pi pi-share-alt"
    size="small"
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
            ref="copyButton"
            v-tooltip="tooltipConfig"
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
  import { ref, computed, nextTick } from 'vue'
  import Button from 'primevue/button'
  import InputText from 'primevue/inputtext'
  import OverlayPanel from 'primevue/overlaypanel'

  const overlayPanel = ref()
  const copyButton = ref()
  const tooltipMessage = ref('')
  const showTooltip = ref(false)
  const url = computed(() => window.location.href)

  const tooltipConfig = computed(() => {
    if (!showTooltip.value) {
      return { disabled: true }
    }
    return {
      value: tooltipMessage.value,
      showDelay: 0,
      hideDelay: 2000,
      disabled: false
    }
  })

  const toggle = (event) => {
    overlayPanel.value.toggle(event)
  }

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(url.value)
    tooltipMessage.value = 'Copied'
    showTooltip.value = true
    
    await showTooltipOnButton()
  } catch (err) {
    tooltipMessage.value = 'Failed to copy'
    showTooltip.value = true
    
    await showTooltipOnButton()
  }
}

const showTooltipOnButton = async () => {
  await nextTick()
  
  const buttonEl = copyButton.value?.$el || copyButton.value
  if (buttonEl) {
    const mouseEnterEvent = new MouseEvent('mouseenter', { bubbles: true })
    buttonEl.dispatchEvent(mouseEnterEvent)
    
    setTimeout(() => {
      const mouseLeaveEvent = new MouseEvent('mouseleave', { bubbles: true })
      buttonEl.dispatchEvent(mouseLeaveEvent)
      showTooltip.value = false
    }, 2000)
  }
}
  }
</script>
