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
        <FeedbackFish />
        <ProfileBlock />
      </div>
    </div>

    <AzionLogo
      class="cursor-pointer"
      @click="redirectToRoute('login')"
      v-else
    />
  </header>
</template>

<script setup>
  import { ref, provide, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { useWindowSize } from '@vueuse/core'

  import AzionLogo from '@assets/svg/logo'
  import AzionMobileLogo from '@assets/svg/mobile-logo'
  import SidebarBlock from '@templates/sidebar-block'
  import Create from './create'
  import FeedbackFish from './feedback-fish'
  import Help from './help'
  import SwitchAccount from './switch-account'
  import ProfileBlock from '@templates/profile-block'

  defineOptions({ name: 'navbar-block' })

  const router = useRouter()
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
