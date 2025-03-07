<script setup>
  import DynamicDialog from 'primevue/dynamicdialog'
  import { computed, inject, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import { useAccountStore } from '@/stores/account'
  import { storeToRefs } from 'pinia'
  import { themeSelect } from '@/helpers'
  import Layout from '@/layout'
  import '@modules/real-time-metrics/helpers/convert-date'
  import '@/helpers/store-handler'

  /** @type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const accountStore = useAccountStore()

  const { currentTheme, hasActiveUserId, account } = storeToRefs(accountStore)

  const route = useRoute()

  const updateTrackingTraits = () => {
    const {
      user_id: userID,
      id: accountId,
      client_id: clientId,
      email,
      name,
      kind: accountType,
      status
    } = accountStore.account

    const defaultTraits = {
      client_id: clientId,
      email,
      account_id: accountId,
      account_name: name,
      account_type: accountType,
      client_status: status
    }

    tracker.assignGroupTraits(defaultTraits)
    tracker.identify(userID)
  }

  const isLogged = computed(() => {
    // evaluating as !route.meta?.hideNavigation will cause navbar to flicker
    return route.meta.hideNavigation !== true && hasActiveUserId.value
  })

  const root = document.querySelector(':root')
  watch(currentTheme, (theme) => themeSelect({ HTMLElement: root, theme }))
  watch(account, () => {
    updateTrackingTraits()
  })
</script>

<template>
  <DynamicDialog />
  <Layout :isLogged="isLogged" />
</template>
