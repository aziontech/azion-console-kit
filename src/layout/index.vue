<template>
  <div class="min-h-screen flex flex-col h-full">
    <ToastBlock />

    <AppNavbar
      :showNavItems="showNavItems"
      :listTypeAccountService="listTypeAccountService"
      :accountHandler="accountHandler"
    />
    <PageLoadingBlock :showLoading="showLoading" />
    <AppSidebar />

    <main
      class="flex flex-col flex-1 min-h-screen transition-margin-right pt-14 h-full"
      :class="{ 'mr-[32rem]': isSidebarActive }"
      :style="{ transition: 'margin-right 0.2s' }"
      v-if="!showLoading"
    >
      <router-view class="flex flex-1" />
      <AppFooter />
    </main>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import AppFooter from '@/layout/app-footer'
  import AppNavbar from './app-navbar.vue'
  import ToastBlock from '@/templates/toast-block'
  import AppSidebar from './app-sidebar.vue'
  import { listTypeAccountService } from '@/services/switch-account-services/list-type-account-service'
  import { switchAccountService } from '@/services/auth-services/switch-account-service'
  import { AccountHandler } from '@/helpers/account-handler'
  import PageLoadingBlock from '@/templates/loading-block'
  import { useLayout } from '@/composables/use-layout'

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
</script>
