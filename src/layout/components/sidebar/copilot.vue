<script setup>
  import PrimeButton from '@aziontech/webkit/button'
  import PrimeTag from '@aziontech/webkit/prime-tag'
  import Toolbar from '@aziontech/webkit/toolbar'
  import { useLayout } from '@/composables/use-layout'
  import CopilotFrame from '@/modules/azion-ai-chat/layout/copilot-frame.vue'
  import { useRouter } from 'vue-router'
  import { watch } from 'vue'

  defineOptions({
    name: 'copilot-sidebar'
  })

  const { closeSidebar } = useLayout()
  const router = useRouter()

  const openChatInNewTab = () => {
    router.push({ name: 'copilot' })
  }

  watch(
    () => router.currentRoute.value.name,
    (name) => {
      if (name === 'copilot') {
        closeSidebar()
      }
    }
  )
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-3.5rem)]">
    <Toolbar
      class="border-noround surface-section border-x-none w-full pl-6 pr-8 py-3 z-10 border-top-none"
    >
      <template #start>
        <h3 class="text-color text-lg font-medium flex gap-3">
          Azion Copilot
          <PrimeTag
            v-tooltip.bottom="
              'Copilot is in preview mode and can make mistakes. Consider verifying important information.'
            "
            value="Preview"
          />
        </h3>
      </template>
      <template #end>
        <div class="flex gap-2">
          <!-- TODO: wire up once the postMessage bridge to the Copilot app exists -->
          <PrimeButton
            icon="pi pi-eraser"
            outlined
            class="surface-border h-8 w-8"
            aria-label="New chat"
            v-tooltip.bottom="'New chat'"
          />
          <PrimeButton
            icon="pi pi-arrow-up-right-and-arrow-down-left-from-center"
            outlined
            class="surface-border h-8 w-8"
            aria-label="Open chat to full page"
            v-tooltip.bottom="'Open chat to full page'"
            @click="openChatInNewTab"
          />
          <PrimeButton
            icon="pi pi-times"
            outlined
            class="surface-border h-8 w-8"
            aria-label="Close"
            v-tooltip.bottom="'Close'"
            @click="closeSidebar"
          />
        </div>
      </template>
    </Toolbar>
    <CopilotFrame class="flex-1" />
  </div>
</template>
