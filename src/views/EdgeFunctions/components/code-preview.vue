<template>
  <iframe
    class="w-full h-full border-0"
    ref="previewIframe"
    @load="postPreviewUpdates"
    allowfullscreen
    src="https://code-preview.azion.com/preview"
    title="preview"
    sandbox="allow-scripts"
  />
</template>

<script setup>
  import { ref, watch } from 'vue'

  const props = defineProps({
    updateObject: {
      type: Object,
      required: true
    }
  })

  const previewIframe = ref(null)

  const postPreviewUpdates = () => {
    const previewWindow = previewIframe.value.contentWindow
    previewWindow.postMessage(
      {
        event: 'azion-code-editor',
        eventType: 'update',
        source: window.location.href,
        message: JSON.stringify(props.updateObject)
      },
      '*'
    )
  }

  watch(() => props.updateObject, postPreviewUpdates)
</script>
