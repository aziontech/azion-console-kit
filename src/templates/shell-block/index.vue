<template>
  <ToastBlock />
  <MainMenuBlock :isLogged="isLogged" />
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
  import { mapState } from 'pinia'
  import { useHelpCenterStore } from '@/stores/help-center'

  export default {
    name: 'shell-block',
    props: { isLogged: Boolean },
    components: {
      FooterBlock,
      MainMenuBlock,
      HelpBlock,
      ToastBlock
    },
    computed: {
      ...mapState(useHelpCenterStore, { showHelp: 'isOpen' }),
      customClass() {
        return this.showHelp ? 'active' : ''
      },
      customClassHelper() {
        return this.showHelp ? 'active-helper' : ''
      },

      styleHelper() {
        return '[&>.active-helper]:block transform [&>.active-helper]:md:translate-x-0'
      }
    }
  }
</script>
