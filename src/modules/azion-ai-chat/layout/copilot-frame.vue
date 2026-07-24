<script setup>
  import { onMounted } from 'vue'

  import { makeCopilotWidgetUrl } from '../services/make-copilot-widget-url'
  import { loadCopilotWidgetScript } from '../services/load-copilot-widget-script'
  import { makeCopilotAppUrl } from '../services/make-copilot-app-url'

  defineOptions({
    name: 'CopilotFrame'
  })

  const apiUrl = makeCopilotAppUrl()

  onMounted(() => {
    loadCopilotWidgetScript(makeCopilotWidgetUrl())
  })
</script>

<template>
  <azion-chat-widget
    :api-url="apiUrl"
    data-testid="Copilot-widget"
    class="w-full h-full flex-1 block"
  ></azion-chat-widget>
</template>
