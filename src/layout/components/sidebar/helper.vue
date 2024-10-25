<script setup>
  import { ref } from 'vue'
  import SelectButton from 'primevue/selectbutton'
  import PrimeButton from 'primevue/button'
  import { useLayout } from '@/composables/use-layout'
  import Toolbar from 'primevue/toolbar'
  import AzionAiChatFullSizeBlock from '@/modules/azion-ai-chat/azion-ai-chat-block.vue'

  const value = ref('Azion Copilot')
  const options = ref(['Azion Copilot', 'Documentation'])
  defineOptions({
    name: 'helper-sidebar'
  })

  const { toggleSidebar } = useLayout()
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-3.5rem)]">
    <Toolbar class="border-noround border-x-none w-full pl-6 pr-8 py-3 z-10 border-top-none">
      <template #start>
        <SelectButton
          v-model="value"
          :options="options"
          aria-labelledby="basic"
        />
      </template>

      <template #end>
        <div class="flex gap-3">
          <PrimeButton
            icon="pi pi-external-link"
            outlined
            class="surface-border h-8 w-8"
            aria-label="Open a chat in new tab"
            v-tooltip.bottom="'Open a chat in new tab'"
            @click="openChatInNewTab"
          />
          <PrimeButton
            icon="pi pi-times"
            outlined
            class="surface-border h-8 w-8"
            aria-label="Close"
            @click="toggleSidebar"
          />
        </div>
      </template>
    </Toolbar>
    <div class="flex h-full">
      <AzionAiChatFullSizeBlock />
    </div>
  </div>
</template>
