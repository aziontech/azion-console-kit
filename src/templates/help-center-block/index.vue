<template>
  <div
    :class="[customClassHelper, { hidden: !helpCenterStore.isOpen }]"
    class="flex flex-col surface-border border-l w-slide h-full z-[0] sticky top-12 right-0 ease-in-out"
  >
    <!-- Header -->
    <div class="flex flex-col w-full justify-between pl-6 md:pr-8 pr-3 py-3 surface-border gap-6">
      <div class="flex w-full gap-2 justify-between surface-border">
        <h3 class="text-color text-lg font-medium">Help Center</h3>
        <div class="flex gap-2">
          <PrimeButton
            icon="pi pi-window-maximize"
            outlined
            class="surface-border h-8 w-8"
            aria-label="Open Copilot in a new tab"
            v-tooltip.bottom="'Open Copilot in a new tab'"
            @click="openChatInNewTab"
          />
          <PrimeButton
            icon="pi pi-times"
            outlined
            class="surface-border h-8 w-8"
            aria-label="Close"
            @click="helpCenterStore.close()"
          />
        </div>
      </div>

      <!-- Tabs -->
      <TabView
        :activeIndex="activeTab"
        :pt="{
          navContainer: 'mb-6'
        }"
      >
        <TabPanel
          v-if="!isCopilotInFullSizeMode"
          :header="'Copilot'"
        >
          <AzionAiChatBlock />
        </TabPanel>
        <TabPanel :header="'Documentation'">
          <DocumentationTab />
        </TabPanel>
      </TabView>
    </div>
  </div>
</template>

<script setup>
  import { useHelpCenterStore } from '@/stores/help-center'
  import DocumentationTab from './documentation.vue'
  import PrimeButton from 'primevue/button'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import { computed, ref, watchEffect } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import AzionAiChatBlock from '@/modules/azion-ai-chat/index.vue'
  import { windowOpen } from '@/helpers'

  defineOptions({ name: 'SlideIn' })
  const activeTab = ref(0)
  const isCopilotInFullSizeMode = ref(false)
  const router = useRouter()
  const currentRoute = useRoute()

  const COPILOT_ROUTE_NAME = 'copilot'

  const helpCenterStore = useHelpCenterStore()
  const openChatInNewTab = () => {
    const copilotPath = router.resolve({ name: COPILOT_ROUTE_NAME }).path;
    windowOpen(`${window.location.origin}${copilotPath}`, '_blank');
  }

  const customClassHelper = computed(() => (helpCenterStore.isOpen ? 'active-helper' : ''))

  watchEffect(() => {
    isCopilotInFullSizeMode.value = currentRoute.name === COPILOT_ROUTE_NAME
  })
</script>
