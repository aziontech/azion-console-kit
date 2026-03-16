<template>
  <div class="min-h-screen flex flex-col surface-ground">
    <ToastBlock />

    <AppNavbar
      :showNavItems="showNavItems"
      :isBootstrapping="isBootstrapping"
      :listTypeAccountService="listTypeAccountService"
      :accountHandler="accountHandler"
    />

    <AppSidebar />

    <main
      class="flex flex-col flex-1 min-h-screen transition-margin-right pt-14"
      :class="{ 'mr-[32rem]': showSidebar }"
      :style="{ transition: 'margin-right 0.2s' }"
    >
      <InfoBanner />
      <div class="flex flex-1 flex-col">
        <router-view class="flex flex-1 flex-col" />
      </div>
      <AppFooter v-show="!isBootstrapping" />
    </main>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { useRoute } from 'vue-router'
  import AppFooter from '@/layout/app-footer'
  import AppNavbar from './app-navbar.vue'
  import ToastBlock from '@/templates/toast-block'
  import AppSidebar from './app-sidebar.vue'
  import InfoBanner from '@/templates/info-banner'

  import { listTypeAccountService } from '@/services/switch-account-services/list-type-account-service'
  import { switchAccountService } from '@/services/auth-services/switch-account-service'
  import { AccountHandler } from '@/helpers/account-handler'
  import { useLayout } from '@/composables/use-layout'
  import { useAccountStore } from '@/stores/account'
  import { storeToRefs } from 'pinia'

  defineOptions({ name: 'app-layout' })

  const props = defineProps({
    isLogged: Boolean
  })

  const route = useRoute()
  const accountHandler = new AccountHandler(switchAccountService, listTypeAccountService)
  const { isSidebarActive, isVisibleMobileSidebar } = useLayout()
  const { hasSession } = storeToRefs(useAccountStore())

  const showNavItems = computed(() => props.isLogged)
  const isBootstrapping = computed(
    () => hasSession.value && route.meta?.hideNavigation !== true && !props.isLogged
  )
  const showSidebar = computed(() => isSidebarActive.value && isVisibleMobileSidebar.value)
</script>
