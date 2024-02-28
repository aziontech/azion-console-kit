<script setup>
  import { computed, inject, watch } from 'vue'
  import { RouterView, useRoute } from 'vue-router'
  import ShellBlock from '@/templates/shell-block'
  import { useAccountStore } from '@/stores/account'
  import { storeToRefs } from 'pinia'
  import { themeSelect } from '@/helpers'
  // eslint-disable-next-line no-unused-vars
  import { AnalyticsTrackerAdapter } from '@/plugins/adapters/AnalyticsTrackerAdapter'

  /** @type {AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const accountStore = useAccountStore()

  const { currentTheme, hasActiveUserId, account } = storeToRefs(accountStore)

  const route = useRoute()

  const updateTrackingTraits = () => {
    const { kind: accountType, client_id: clientId } = accountStore.account
    const isAccountTypeWithoutClientId = accountType !== 'client'
    if (isAccountTypeWithoutClientId) return

    const defaultTraits = { client_id: clientId }
    tracker.assignGroupTraits(defaultTraits)
    tracker.identify(clientId)
  }

  const isLogged = computed(() => {
    // evaluating as !route.meta?.hideNavigation will cause navbar to flicker
    return route.meta.hideNavigation !== true && hasActiveUserId.value
  })

  watch(currentTheme, (theme) => themeSelect({ theme }))
  watch(account, () => {
    updateTrackingTraits()
  })
</script>

<template>
  <div class="flex flex-col">
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
@/plugins/AnalyticsTrackerAdapter @/plugins/adapter/AnalyticsTrackerAdapter
