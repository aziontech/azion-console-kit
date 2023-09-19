<template>
  <MainMenuBlock
    @showSlideHelper="showHelperCenter"
    :helperVisible="isHelperVisible"
    :isLogged="isLogged"
  />
  <div
    class="flex w-full relative min-h-[calc(100vh-120px)] [&>.active]:!w-[calc(100%-300px)]"
    :class="[styleHelper, { 'flex align-items-center': !isLogged }]"
  >
    <slot :customClass="customClass"></slot>
    <help
      :class="customClassHelper"
      @closeSlideIn="close"
    ></help>
  </div>

  <FooterBlock />
</template>

<script>
  import MainMenuBlock from '@/templates/main-menu-block'
  import FooterBlock from '@/templates/footer-block'
  import Help from '../slide-in/help.vue'

  export default {
    name: 'shell-block',
    props: { isLogged: Boolean },
    components: {
      FooterBlock,
      MainMenuBlock,
      Help
    },
    data() {
      return {
        isHelperVisible: false
      }
    },
    computed: {
      customClass() {
        const isActive = this.isActive(this.isHelperVisible)
        return isActive ? 'active' : ''
      },
      customClassHelper() {
        return this.isHelperVisible ? 'active-helper' : ''
      },

      styleHelper() {
        return `[&>.active-helper]:block [&>.active-helper]:transform [&>.active-helper]:translate-x-0`
      }
    },
    methods: {
      isActive(...variables) {
        return variables.includes(true)
      },
      showHelperCenter(value) {
        this.isHelperVisible = value
      },
      close() {
        this.isHelperVisible = false
      }
    }
  }
</script>
