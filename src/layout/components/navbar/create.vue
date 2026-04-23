<template>
  <PrimeButton
    @click="handleCreateClick"
    icon="pi pi-plus"
    :label="currentLabel"
    class="h-8 w-8 md:w-fit text-white border-header bg-header hover:bg-header-button-hover"
    size="small"
    :pt="{
      label: { class: 'text-white' },
      icon: { class: 'text-white' }
    }"
    v-tooltip.bottom="{ value: 'Create', showDelay: 200 }"
  />
</template>

<script setup>
  import { computed, inject } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useAccountStore } from '@/stores/account'
  import { storeToRefs } from 'pinia'
  import { useToast } from '@aziontech/webkit/use-toast'

  import PrimeButton from '@aziontech/webkit/button'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  defineOptions({ name: 'navbar-create-block' })

  const router = useRouter()
  const route = useRoute()
  const currentWidth = inject('currentWidth')
  const SCREEN_BREAKPOINT_MD = 768

  const accountStore = useAccountStore()
  const { accountData } = storeToRefs(accountStore)
  const toast = useToast()

  const handleCreateClick = () => {
    tracker.create.createEventInHomeAndHeader({ url: route.path, location: 'header' }).track()
    if (accountData.value.kind !== 'client') {
      toast.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Only client accounts have access to the create system',
        life: 3000
      })
      return
    }
    router.push({ name: 'create-new-templates' })
  }

  const currentLabel = computed(() => {
    if (currentWidth.value > SCREEN_BREAKPOINT_MD) {
      return 'Create'
    }
    return ''
  })
</script>
