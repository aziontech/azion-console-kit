<template>
  <div class="min-h-screen flex flex-col h-full">
    <ToastBlock />

    <AppNavbar
      :showNavItems="showNavItems"
      :listTypeAccountService="listTypeAccountService"
      :accountHandler="accountHandler"
    />

    <AppSidebar />

    <main
      class="flex flex-col flex-1 min-h-screen transition-margin-right pt-14 h-full"
      :class="{ 'mr-[32rem]': showSidebar }"
      :style="{ transition: 'margin-right 0.2s' }"
    >
      <router-view class="flex flex-1 flex-col" />
      <AppFooter v-if="!isLoading" />
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
  import { useLayout } from '@/composables/use-layout'
  import { useLoadingStore } from '@/stores/loading'

  defineOptions({ name: 'app-layout' })

  const props = defineProps({
    isLogged: Boolean
  })

  const accountHandler = new AccountHandler(switchAccountService, listTypeAccountService)
  const { isSidebarActive, isVisibleMobileSidebar } = useLayout()
  const loadingStore = useLoadingStore()

  const showNavItems = computed(() => props.isLogged)
  const showSidebar = computed(() => isSidebarActive.value && isVisibleMobileSidebar.value)
  const isLoading = computed(() => loadingStore.isLoading)
</script>
