<template>
  <MainMenuBlock :isLogged="isLogged" />
  <main
    class="flex w-full relative min-h-[calc(100vh-120px)] [&>.active]:md:w-[calc(100%-300px)] mt-14"
    :class="[styleHelper, { 'flex align-items-center': !isLogged }]"
  >
    <slot :customClass="customClass"></slot>
    <help :class="customClassHelper"></help>
  </main>
  <FooterBlock />
</template>

<script>
  import MainMenuBlock from '@/templates/main-menu-block'
  import FooterBlock from '@/templates/footer-block'
  import Help from '../slide-in/help.vue'
  import { mapState } from 'pinia'
  import { useHelpCenterStore } from '@/stores/help-center'

  export default {
    name: 'shell-block',
    props: { isLogged: Boolean },
    components: {
      FooterBlock,
      MainMenuBlock,
      Help
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
        return `[&>.active-helper]:block transform [&>.active-helper]:md:translate-x-0`
      }
    }
  }
</script>
