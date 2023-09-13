<template>
  <MainMenuBlock
    @showSlideHelper="showHelperCenter"
    @showSlideCenter="showCenter"
    :helperVisible="isHelperVisible"
    :centerVisible="isCenterVisible"
  />
  <div
    class="flex w-full relative min-h-[calc(100vh-120px)] [&>.active]:!w-[calc(100%-300px)]"
    :class="[ styleCenter, styleHelper ]"
  >
    <slot :customClass="customClass"></slot>
    <helper
      :class="customClassHelper"
      @closeRightSidebar="close"
    ></helper>
    <center-component
      :class="customClassCenter"
      @closeRightSidebar="close"
    ></center-component>
  </div>

  <FooterBlock />
</template>

<script>
  import MainMenuBlock from '@/templates/main-menu-block'
  import FooterBlock from '@/templates/footer-block'
  import Helper from '../test/helper.vue'
  import Center from '../test/center.vue'

  export default {
    name: 'shell-block',
    components: {
      FooterBlock,
      MainMenuBlock,
      Helper,
      'center-component': Center
    },
    data() {
      return {
        isHelperVisible: false,
        isCenterVisible: false
      }
    },
    computed: {
      customClass() {
        const isActive = this.isActive(this.isHelperVisible, this.isCenterVisible)
        return isActive ? 'active' : ''
      },
      customClassHelper() {
        return this.isHelperVisible ? 'active-helper' : ''
      },
      customClassCenter() {
        return this.isCenterVisible ? 'active-center' : ''
      },
      styleHelper() {
        return `[&>.active-helper]:block [&>.active-helper]:transform [&>.active-helper]:translate-x-0`
      },
      styleCenter() {
        return `[&>.active-center]:block [&>.active-center]:transform [&>.active-center]:translate-x-0`
      }
    },
    methods: {
      isActive(...variables) {
        return variables.includes(true)
      },
      showHelperCenter(value) {
        this.isHelperVisible = value
        this.isCenterVisible = false
      },
      showCenter(value) {
        this.isCenterVisible = value
        this.isHelperVisible = false
      },
      close() {
        this.isHelperVisible = false
        this.isCenterVisible = false
      }
    }
  }
</script>
