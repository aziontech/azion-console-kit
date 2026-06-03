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
        <ProductionMenuBlock />

        <AzionLogo
          class="max-md:hidden cursor-pointer"
          @click="redirectToRoute"
        />

        <AzionMobileLogo
          class="md:hidden cursor-pointer"
          @click="redirectToRoute"
        />

        <SwitchAccount
          :listTypeAccountService="listTypeAccountService"
          :accountHandler="accountHandler"
        />
      </div>
      <div class="flex gap-2 items-center ml-auto">
        <Create />

        <ButtonCopilot />

        <ConsoleFeedback
          class="text-white border-header bg-header hover:bg-header-button-hover"
          :outlined="false"
          style-text-color="text-white"
        />

        <ButtonHelper />

        <ProfileMenuBlock />
      </div>
    </div>

    <div
      v-else-if="props.isBootstrapping"
      class="flex w-full items-center"
    >
      <div class="flex items-center gap-3">
        <Skeleton
          width="2rem"
          height="2rem"
          borderRadius="6px"
        />
        <Skeleton
          width="5.5rem"
          height="1.75rem"
          borderRadius="4px"
          class="max-md:hidden"
        />
        <Skeleton
          width="2rem"
          height="2rem"
          borderRadius="6px"
          class="md:hidden"
        />
      </div>
      <div class="flex gap-2 items-center ml-auto">
        <!-- Desktop: 3 wide + 2 small -->
        <Skeleton
          width="6.5rem"
          height="2rem"
          borderRadius="6px"
          class="max-md:hidden"
        />
        <Skeleton
          width="6.5rem"
          height="2rem"
          borderRadius="6px"
          class="max-md:hidden"
        />
        <Skeleton
          width="6.5rem"
          height="2rem"
          borderRadius="6px"
          class="max-md:hidden"
        />
        <Skeleton
          width="2rem"
          height="2rem"
          borderRadius="6px"
          class="max-md:hidden"
        />
        <Skeleton
          width="2rem"
          height="2rem"
          borderRadius="6px"
          class="max-md:hidden"
        />
        <!-- Mobile: all buttons same small size -->
        <Skeleton
          width="2rem"
          height="2rem"
          borderRadius="6px"
          class="md:hidden"
        />
        <Skeleton
          width="2rem"
          height="2rem"
          borderRadius="6px"
          class="md:hidden"
        />
        <Skeleton
          width="2rem"
          height="2rem"
          borderRadius="6px"
          class="md:hidden"
        />
        <Skeleton
          width="2rem"
          height="2rem"
          borderRadius="6px"
          class="md:hidden"
        />
        <Skeleton
          width="2rem"
          height="2rem"
          borderRadius="6px"
          class="md:hidden"
        />
      </div>
    </div>

    <div
      v-else
      class="flex w-full flex-row justify-between items-center"
    >
      <AzionLogo
        class="cursor-pointer"
        @click="redirectToRoute"
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
  import ButtonHelper from '@/layout/components/navbar/button-helper.vue'
  import ButtonCopilot from '@/layout/components/navbar/button-copilot.vue'

  import { ref, provide, watch } from 'vue'
  import Skeleton from '@aziontech/webkit/skeleton'
  import PrimeButton from '@aziontech/webkit/button'
  import { useRouter, useRoute } from 'vue-router'
  import { useWindowSize } from '@vueuse/core'

  import AzionLogo from '@assets/svg/logo'
  import AzionMobileLogo from '@assets/svg/mobile-logo'
  import Create from '@/layout/components/navbar/create'
  import ConsoleFeedback from '@/layout/components/navbar/feedback'
  import SwitchAccount from '@/layout/components/navbar/switch-account'
  import ProductionMenuBlock from '@/layout/components/menu-production'
  import ProfileMenuBlock from '@/layout/components/menu-profile'
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
    isBootstrapping: {
      type: Boolean,
      default: false
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

  const redirectToRoute = () => {
    router.push({ path: '/' })
  }

  watch(
    width,
    () => {
      currentWidth.value = width.value
    },
    { immediate: true }
  )
</script>
