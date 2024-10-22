<template>
  <ToastBlock />
  <MainMenuBlock
    :showNavItems="showNavItems"
    :listTypeAccountService="listTypeAccountService"
    :accountHandler="accountHandler"
  />

  <PageLoadingBlock :showLoading="showLoading" />

  <div
    class="flex flex-col w-full h-full"
    :class="[styleHelper]"
  >
    <main
      class="flex w-full relative min-h-[calc(100vh-120px)] [&>.active]:md:w-[calc(100%-384px)] mt-14"
      :class="{ 'flex align-items-center': props.isLogged }"
    >
      <slot :customClass="customClass" />
    </main>
    <FooterBlock />
  </div>
</template>

<script setup>
  import { storeToRefs } from 'pinia'
  import { computed } from 'vue'
  import FooterBlock from '@/templates/footer-block'
  import PageLoadingBlock from '@/templates/loading-block'
  import MainMenuBlock from '@/templates/main-menu-block'
  import ToastBlock from '@/templates/toast-block'

  import { AccountHandler } from '@/helpers/account-handler'
  import { switchAccountService } from '@/services/auth-services/switch-account-service'
  import { listTypeAccountService } from '@/services/switch-account-services/list-type-account-service'
  import { useHelpCenterStore } from '@/stores/help-center'
  import { useAzionAiChatStore } from '@/stores/azion-ai-chat-store'
  import { useLoadingStore } from '@/stores/loading'

  defineOptions({ name: 'shell-block' })
  const props = defineProps({ isLogged: Boolean })

  const { showLoading } = storeToRefs(useLoadingStore())

  const showNavItems = computed(() => props.isLogged && !showLoading.value)

  const helpCenterStore = useHelpCenterStore()
  const azionAiChatStore = useAzionAiChatStore()

  const accountHandler = new AccountHandler(switchAccountService, listTypeAccountService)

  const customClass = computed(() =>
    helpCenterStore.isOpen || azionAiChatStore.isOpen ? 'active' : ''
  )
  const customClassHelper = computed(() => (helpCenterStore.isOpen ? 'active-helper' : ''))
  const styleHelper = '[&>.active-helper]:block transform [&>.active-helper]:md:translate-x-0'

  const aiChatIsOpen = computed(() => {
    return azionAiChatStore.isOpen ? 'active-helper' : ''
  })
</script>
