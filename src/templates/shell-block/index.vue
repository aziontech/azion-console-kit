<template>
  <ToastBlock />
  <MainMenuBlock
    :isLogged="props.isLogged"
    :listTypeAccountService="listTypeAccountService"
    :accountHandler="accountHandler"
  />

  <div
    class="bg-black/20 z-50 mt-[3.5rem] min-h-screen cursor-progress fixed w-full"
    v-if="showLoading"
  >
    <ProgressBar
      class="sticky"
      mode="indeterminate"
      style="height: 0.375rem"
    ></ProgressBar>
  </div>
  <main
    class="flex w-full relative min-h-[calc(100vh-120px)] [&>.active]:md:w-[calc(100%-384px)] mt-14"
    :class="[styleHelper, { 'flex align-items-center': !props.isLogged }]"
  >
    <slot :customClass="customClass"></slot>
    <HelpBlock :class="customClassHelper" />
  </main>

  <FooterBlock />
</template>

<script setup>
  defineOptions({ name: 'shell-block' })
  import { storeToRefs } from 'pinia'

  import { computed } from 'vue'
  import ToastBlock from '@/templates/toast-block'
  import MainMenuBlock from '@/templates/main-menu-block'
  import FooterBlock from '@/templates/footer-block'
  import HelpBlock from '@/templates/help-center-block'

  import ProgressBar from 'primevue/progressbar'

  import { useHelpCenterStore } from '@/stores/help-center'
  import { listTypeAccountService } from '@/services/switch-account-services/list-type-account-service'
  import { switchAccountService } from '@/services/auth-services/switch-account-service'
  import { AccountHandler } from '@/helpers/account-handler'
  import { useLoadingStore } from '@/stores/loading'

  const props = defineProps({
    isLogged: Boolean
  })

  const helpCenterStore = useHelpCenterStore()

  const accountHandler = new AccountHandler(switchAccountService, listTypeAccountService)

  const customClass = computed(() => (helpCenterStore.isOpen ? 'active' : ''))
  const customClassHelper = computed(() => (helpCenterStore.isOpen ? 'active-helper' : ''))
  const styleHelper = '[&>.active-helper]:block transform [&>.active-helper]:md:translate-x-0'
  const store = useLoadingStore()

  const { showLoading } = storeToRefs(store)
</script>
