<script setup>
  import { useRoute, useRouter } from 'vue-router'
  import { hasFlagUseV6Configurations } from '@/composables/user-flag'
  import TabsView from './TabsView.vue'
  import LegacyEditView from './legacy/EditView.vue'

  defineOptions({ name: 'edit-workload-dispatcher' })

  defineProps({
    updatedRedirect: { type: String, required: true }
  })

  const isV6 = hasFlagUseV6Configurations()

  // Legacy accounts have no tabbed edit view; normalize any deep-linked tab back to the base edit URL.
  if (!isV6) {
    const route = useRoute()
    const router = useRouter()
    if (route.params.tab) {
      router.replace({ name: 'edit-workload', params: { id: route.params.id }, query: route.query })
    }
  }
</script>

<template>
  <TabsView
    v-if="isV6"
    :updatedRedirect="updatedRedirect"
  />
  <LegacyEditView
    v-else
    :updatedRedirect="updatedRedirect"
  />
</template>
