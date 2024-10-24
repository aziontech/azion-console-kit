<template>
  <div class="min-h-screen">
    <div :class="containerClass">
      <ToastBlock />

      <AppNavbar
        :showNavItems="showNavItems"
        :listTypeAccountService="listTypeAccountService"
        :accountHandler="accountHandler"
      />
      <PageLoadingBlock :showLoading="showLoading" />
      <AppSidebar />

      <div
        class="flex flex-col min-h-screen justify-between transition-margin-right pt-14"
        :class="{ 'mr-[32rem]': isSidebarActive }"
        :style="{ transition: 'margin-right 0.2s' }"
        v-if="!showLoading"
      >
        <router-view />
        <AppFooter />
      </div>
    </div>
  </div>
</template>

<script setup>
  // import { useLayout } from '@/layout/composables/layout'
  import { computed } from 'vue'
  import AppFooter from '@/layout/app-footer'
  import AppNavbar from './app-navbar.vue'
  import ToastBlock from '@/templates/toast-block'
  import AppSidebar from './app-sidebar.vue'
  import { listTypeAccountService } from '@/services/switch-account-services/list-type-account-service'
  import { switchAccountService } from '@/services/auth-services/switch-account-service'
  import { AccountHandler } from '@/helpers/account-handler'
  import PageLoadingBlock from '@/templates/loading-block'
  import { useLayout } from '@/composables/useLayout'

  import { useLoadingStore } from '@/stores/loading'
  import { storeToRefs } from 'pinia'

  defineOptions({ name: 'app-layout' })

  const props = defineProps({
    isLogged: Boolean
  })

  const { showLoading } = storeToRefs(useLoadingStore())
  const accountHandler = new AccountHandler(switchAccountService, listTypeAccountService)
  const { isSidebarActive } = useLayout()
  const showNavItems = computed(() => props.isLogged && !showLoading.value)

  const containerClass = computed(() => {
    return {}
  })
</script>
