<template>
  <div class="flex flex-col h-screen">
    <MainMenuBlock
      @showSlideHelper="showHelperCenter"
      :helperVisible="isHelperVisible"
      :isLogged="isLogged"
      
    />
    <main
      class="flex w-full h-full relative [&>.active]:!w-[calc(100%-300px)] pt-[60px]"
      :class="[styleHelper, { 'flex align-items-center': !isLogged }]"
    >
      <slot :customClass="customClass"></slot>
      <help
        :class="customClassHelper"
        @closeSlideIn="close"
      ></help>
    </main>
  
    <FooterBlock />
  </div>
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
