<script setup>
  import DynamicDialog from 'primevue/dynamicdialog'
  import { computed, inject, watch } from 'vue'
  import { RouterView, useRoute } from 'vue-router'
  import ShellBlock from '@/templates/shell-block'
  import { useAccountStore } from '@/stores/account'
  import { storeToRefs } from 'pinia'
  import { themeSelect } from '@/helpers'
  import '@modules/real-time-metrics/helpers/convert-date'
  import '@/helpers/store-handler'

  /** @type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const accountStore = useAccountStore()

  const { currentTheme, hasActiveUserId, account } = storeToRefs(accountStore)

  const route = useRoute()

  const updateTrackingTraits = () => {
    const {
      kind: accountType,
      user_id: userID,
      client_id: clientId,
      email,
      name
    } = accountStore.account
    const isAccountTypeWithoutClientId = accountType !== 'client'
    if (isAccountTypeWithoutClientId) return

    const defaultTraits = { client_id: clientId, email, name }
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
  <div class="flex flex-col">
    <DynamicDialog />
    <ShellBlock
      v-slot:default="{ customClass }"
      :isLogged="isLogged"
    >
      <RouterView
        :class="customClass"
        class="w-full flex flex-col max-w-full transition-[width] duration-300 ease-in-out"
      />
    </ShellBlock>
  </div>
</template>
