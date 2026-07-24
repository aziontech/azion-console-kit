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
      :class="[{ 'mr-[32rem]': showSidebar }, { 'app-main--fill-viewport': fillViewport }]"
      :style="{ transition: 'margin-right 0.2s' }"
    >
      <InfoBanner />
      <div
        class="flex flex-1 flex-col"
        :class="{ 'min-h-0': fillViewport }"
      >
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

  // Routes that own their vertical scroll and must fill exactly the visible
  // viewport (so an inner region — e.g. a virtualized table — scrolls
  // INTERNALLY instead of growing the document). Opt-in per route via
  // `meta.fillViewport`; the app's default remains the content-growth /
  // window-scroll model, so no other page is affected.
  const fillViewport = computed(() => route.meta?.fillViewport === true)
</script>

<style scoped>
  /* Fill-viewport routes: pin <main> to the visible viewport height so its
     `flex-1` descendants resolve to a bounded height and the page's inner
     scroll region can size against it. `min-height: 0` neutralizes the base
     `min-h-screen` floor so `100dvh` governs on mobile (where dvh < vh). The
     `main.` prefix raises specificity above the `min-h-screen` utility. */
  main.app-main--fill-viewport {
    height: 100vh;
    height: 100dvh;
    min-height: 0;
  }
</style>
