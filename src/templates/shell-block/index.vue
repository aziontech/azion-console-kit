<template>
  <ToastBlock />
  <MainMenuBlock
    :showNavItems="showNavItems"
    :listTypeAccountService="listTypeAccountService"
    :accountHandler="accountHandler"
  />
  <PageLoadingBlock :showLoading="showLoading" />

  <main
    class="flex w-full relative min-h-[calc(100vh-120px)] [&>.active]:md:w-[calc(100%-384px)] mt-14"
    :class="[
      styleHelper,
      { 'flex align-items-center': !props.isLogged },
      {
        '[&>.active]:md:w-[calc(100%-500px)]': aiChatIsOpen
      }
    ]"
  >
    <slot :customClass="customClass"></slot>

    <HelpBlock
      class="z-10"
      :class="customClassHelper"
    />
    <AskAzionChat
      class="z-20"
      :class="aiChatIsOpen"
    />
  </main>

  <FooterBlock />
</template>

<script setup>
  import { storeToRefs } from 'pinia'
  import { computed } from 'vue'
  import AskAzionChat from '@modules/ask-azion/index.vue'
  import FooterBlock from '@/templates/footer-block'
  import HelpBlock from '@/templates/help-center-block'
  import PageLoadingBlock from '@/templates/loading-block'
  import MainMenuBlock from '@/templates/main-menu-block'
  import ToastBlock from '@/templates/toast-block'

  import { AccountHandler } from '@/helpers/account-handler'
  import { switchAccountService } from '@/services/auth-services/switch-account-service'
  import { listTypeAccountService } from '@/services/switch-account-services/list-type-account-service'
  import { useHelpCenterStore } from '@/stores/help-center'
  import { useAskAzionAiChatStore } from '@/stores/ask-azion-ai-chat'
  import { useLoadingStore } from '@/stores/loading'

  defineOptions({ name: 'shell-block' })
  const props = defineProps({ isLogged: Boolean })

  const { showLoading } = storeToRefs(useLoadingStore())

  const showNavItems = computed(() => props.isLogged && !showLoading.value)

  const helpCenterStore = useHelpCenterStore()
  const askAzionAiChatStore = useAskAzionAiChatStore()

  const accountHandler = new AccountHandler(switchAccountService, listTypeAccountService)

  const customClass = computed(() =>
    helpCenterStore.isOpen || askAzionAiChatStore.isOpen ? 'active' : ''
  )
  const customClassHelper = computed(() => (helpCenterStore.isOpen ? 'active-helper' : ''))
  const styleHelper = '[&>.active-helper]:block transform [&>.active-helper]:md:translate-x-0'

  const aiChatIsOpen = computed(() => {
    return askAzionAiChatStore.isOpen ? 'active-helper' : ''
  })
</script>
