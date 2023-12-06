<template>
  <ToastBlock />
  <MainMenuBlock
    :isLogged="isLogged"
    :listTypeAccountService="listTypeAccountService"
    :accountHandler="accountHandler"
  />
  <ProgressBar
    class="top-[56px] sticky"
    mode="indeterminate"
    style="height: 6px"
    v-if="showLoadingState"
    :pt="{
      value: { class: 'bg-orange-bullet' }
    }"
  ></ProgressBar>
  <main
    class="flex w-full relative min-h-[calc(100vh-120px)] [&>.active]:md:w-[calc(100%-384px)] mt-14"
    :class="[styleHelper, { 'flex align-items-center': !isLogged }]"
  >
    <slot :customClass="customClass"></slot>
    <HelpBlock :class="customClassHelper" />
  </main>

  <FooterBlock />
</template>

<script>
  import ToastBlock from '@/templates/toast-block'
  import MainMenuBlock from '@/templates/main-menu-block'
  import FooterBlock from '@/templates/footer-block'
  import HelpBlock from '@/templates/help-center-block'

  import ProgressBar from 'primevue/progressbar'

  import { useHelpCenterStore } from '@/stores/help-center'
  import { listTypeAccountService } from '@/services/switch-account-services/list-type-account-service'
  import { switchAccountService } from '@/services/auth-services/switch-account-service'
  import { AccountHandler } from '@/helpers/account-handler'
  import { loadingStore } from '@/stores/loading'

  export default {
    name: 'shell-block',
    props: { isLogged: Boolean },
    data() {
      return {
        listTypeAccountService,
        accountHandler: new AccountHandler(switchAccountService, listTypeAccountService)
      }
    },
    components: {
      FooterBlock,
      MainMenuBlock,
      HelpBlock,
      ToastBlock,
      ProgressBar
    },
    computed: {
      customClass() {
        return this.helpCenterStore.isOpen ? 'active' : ''
      },
      customClassHelper() {
        return this.helpCenterStore.isOpen ? 'active-helper' : ''
      },

      styleHelper() {
        return '[&>.active-helper]:block transform [&>.active-helper]:md:translate-x-0'
      },

      showLoadingState() {
        const stateLoading = loadingStore()
        return stateLoading.show
      }
    },
    setup() {
      const helpCenterStore = useHelpCenterStore()

      return { helpCenterStore }
    }
  }
</script>
