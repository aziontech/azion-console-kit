<script setup>
  import DynamicDialog from '@aziontech/webkit/dynamic-dialog'
  import { computed, inject, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import { useAccountStore } from '@/stores/account'
  import { useThemeStore, DARK_SCHEME_QUERY } from '@/stores/theme'
  import { storeToRefs } from 'pinia'
  import { themeApply } from '@/helpers'
  import { captureFirstSessionUrl } from '@/helpers/first-session-url'
  import { useCurrentSubscription } from '@/composables/useCurrentSubscription'
  import { useAdditionalDataFormState } from '@/composables/useAdditionalDataFormState'
  import { safeTrackerCall } from '@/plugins/analytics/safe-call'
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

  const subscription = useCurrentSubscription()
  const { state: additionalDataState } = useAdditionalDataFormState()

  const route = useRoute()

  const updateUserTraits = () => {
    const data = accountStore.account || {}
    tracker.assignUserTraits({
      client_id: data.client_id,
      email: data.email,
      account_id: data.id,
      account_name: data.name,
      account_type: data.kind,
      client_status: data.status
    })
    tracker.identify(data.user_id)
  }

  const updateAccountTraits = async () => {
    const data = accountStore.account || {}
    const accountId = data.id
    if (!accountId) return

    const firmographics = additionalDataState.value || {}

    const traits = {
      account_id: accountId,
      account_name: data.name,
      account_type: data.kind,
      client_status: data.status,
      plan_sku: subscription.planSku.value,
      plan_tier: subscription.planSku.value,
      billing_cycle: subscription.billingCycle.value,
      company_size: firmographics.companySize,
      role: firmographics.role,
      use_case: firmographics.usageIntent,
      website: firmographics.companyWebsite,
      signup_method: accountStore.ssoSignUpMethod,
      lifecycle_stage: subscription.isDowngradePending.value
        ? 'churn-risk'
        : subscription.planSku.value === 'hobby'
          ? 'trial'
          : 'paid'
    }

    await safeTrackerCall(() => tracker.group(accountId, traits))
  }

  const isLogged = computed(() => {
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
    updateUserTraits()
    updateAccountTraits()
  })

  watch(
    () => [subscription.planSku.value, subscription.billingCycle.value],
    () => {
      if (accountStore.account?.id) updateAccountTraits()
    }
  )

  watch(
    () => additionalDataState.value,
    () => {
      if (accountStore.account?.id) updateAccountTraits()
    },
    { deep: true }
  )

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
