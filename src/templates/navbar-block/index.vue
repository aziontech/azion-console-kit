<template>
  <header
    class="p-3 bg-header text-white border-b surface-border items-center flex md:px-8 md:py-3 w-full fixed top-0 z-10 h-14 justify-between"
    @keyup.esc="closeSideBar"
    ref="app"
  >
    <div
      class="flex w-full"
      v-if="props.showNavItems"
    >
      <div class="flex items-center gap-3">
        <SidebarBlock />

        <AzionLogo
          class="max-md:hidden cursor-pointer"
          @click="redirectToRoute('home')"
        />

        <AzionMobileLogo
          class="md:hidden cursor-pointer"
          @click="redirectToRoute('home')"
        />

        <SwitchAccount
          :listTypeAccountService="listTypeAccountService"
          :accountHandler="accountHandler"
        />
      </div>
      <div class="flex gap-2 items-center ml-auto">
        <Create />
        <Help />
        <AiChatButton />
        <FeedbackFish
          class="text-white border-header bg-header hover:bg-header-button-hover"
          :outlined="false"
        />
        <ProfileBlock />
      </div>
    </div>

    <div
      v-else
      class="flex w-full flex-row justify-between items-center"
    >
      <AzionLogo
        class="cursor-pointer"
        @click="redirectToRoute('login')"
      />

      <PrimeButton
        label="Documentation"
        v-if="route.meta.showDocumentButton"
        :pt="{
          label: { class: 'text-white' },
          icon: { class: 'text-white' }
        }"
        @click="openDocumentation"
        size="small"
        iconPos="right"
        icon="pi pi-external-link"
        class="text-white border-header bg-header hover:bg-header-button-hover"
      />
    </div>
  </header>
</template>

<script setup>
  import { ref, provide, watch } from 'vue'
  import PrimeButton from 'primevue/button'
  import { useRouter, useRoute } from 'vue-router'
  import { useWindowSize } from '@vueuse/core'

  import AzionLogo from '@assets/svg/logo'
  import AzionMobileLogo from '@assets/svg/mobile-logo'
  import SidebarBlock from '@templates/sidebar-block'
  import Create from './create'
  import FeedbackFish from './feedback-fish'
  import Help from './help'
  import AiChatButton from './ai-chat-button.vue'
  import SwitchAccount from './switch-account'
  import ProfileBlock from '@templates/profile-block'
  import { openDocumentation } from '@/helpers'

  defineOptions({ name: 'navbar-block' })

  const router = useRouter()
  const route = useRoute()

  const { width } = useWindowSize()
  const currentWidth = ref()
  const openSwitchAccount = ref(false)

  provide('currentWidth', currentWidth)
  provide('openSwitchAccount', openSwitchAccount)

  const props = defineProps({
    showNavItems: {
      type: Boolean
    },
    listTypeAccountService: {
      type: Function,
      required: true
    },
    accountHandler: {
      type: Object,
      required: true
    }
  })

  const redirectToRoute = (name) => {
    const currentRoute = router.currentRoute.value
    if (currentRoute.name === name) {
      router.go(0)
    } else {
      router.push({ name })
    }
  }

  watch(
    width,
    () => {
      currentWidth.value = width.value
    },
    { immediate: true }
  )
</script>
