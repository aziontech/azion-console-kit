<script setup>
  import DynamicDialog from '@aziontech/webkit/dynamic-dialog'
  import { computed, inject, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import { useAccountStore } from '@/stores/account'
  import { useThemeStore, DARK_SCHEME_QUERY } from '@/stores/theme'
  import { storeToRefs } from 'pinia'
  import { themeApply } from '@/helpers'
  import { captureFirstSessionUrl } from '@/helpers/first-session-url'
  import Layout from '@/layout'
  import '@modules/real-time-metrics/helpers/convert-date'
  import '@/helpers/store-handler'

  // Capture the first session URL as early as possible
  captureFirstSessionUrl()

  const DEFAULT_TITLE = 'Azion Console'

  /** @type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const accountStore = useAccountStore()
  const themeStore = useThemeStore()
  const { hasActiveUserId, account } = storeToRefs(accountStore)
  const { currentTheme } = storeToRefs(themeStore)

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

  watch(
    currentTheme,
    (theme) => {
      themeApply(theme)
    },
    { immediate: true }
  )

  watch(account, () => {
    updateTrackingTraits()
  })

  watch(
    () => route,
    (to) => {
      const hasId = to.params.id
      const pageTitle = to.meta?.title ? `${DEFAULT_TITLE} - ${to.meta.title}` : DEFAULT_TITLE
      document.title = hasId ? `${pageTitle} - ${to.params.id}` : pageTitle
    },
    { immediate: true, deep: true }
  )

  window.matchMedia(DARK_SCHEME_QUERY).addEventListener('change', (event) => {
    if (currentTheme.value === 'system') {
      themeApply(event.matches ? 'dark' : 'light')
    }

    themeStore.setResolvedTheme(currentTheme.value)
  })
</script>

<template>
  <DynamicDialog />
  <Layout :isLogged="isLogged" />
</template>
