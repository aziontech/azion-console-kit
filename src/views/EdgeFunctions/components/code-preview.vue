<template>
  <div
    ref="container"
    class="w-full h-full min-w-0"
  >
    <iframe
      class="w-full h-full border-0 block"
      ref="previewIframe"
      @load="postPreviewUpdates"
      allowfullscreen
      src="https://code-preview.azion.com/preview"
      title="preview"
      sandbox="allow-scripts"
    />
  </div>
</template>

<script setup>
  import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

  const props = defineProps({
    updateObject: {
      type: Object,
      required: true
    }
  })

  const previewIframe = ref(null)
  const container = ref(null)
  let ro = null
  const syncIframeSize = () => {
    const el = container.value
    const iframe = previewIframe.value
    if (!el || !iframe) return
    // Explicit sizes help nested content measure correctly after splitter drags
    const widthPx = el.clientWidth
    const heightPx = el.clientHeight
    iframe.style.width = `${widthPx}px`
    iframe.style.height = `${heightPx}px`
  }

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

  onMounted(async () => {
    await nextTick()
    syncIframeSize()
    if ('ResizeObserver' in window && container.value) {
      ro = new ResizeObserver(() => {
        syncIframeSize()
      })
      ro.observe(container.value)
    } else {
      window.addEventListener('resize', syncIframeSize)
    }
  })

  onBeforeUnmount(() => {
    if (ro && container.value) {
      ro.unobserve(container.value)
      ro.disconnect()
      ro = null
    } else {
      window.removeEventListener('resize', syncIframeSize)
    }
  })
</script>

<style scoped>
  /* Ensure no unexpected overflow and block layout */
  iframe {
    display: block;
  }
</style>
*** End Patch
