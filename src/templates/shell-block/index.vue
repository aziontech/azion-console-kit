<template>
  <MainMenuBlock :isLogged="isLogged" />
  <div
    class="flex-grow"
    :class="{ 'flex align-items-center': !isLogged }"
  >
    <slot></slot>
  </div>
  <FooterBlock />
</template>

<script>
import MainMenuBlock from '@/templates/main-menu-block'
import FooterBlock from '@/templates/footer-block'

export default {
  name: 'shell-block',
  props: { isLogged: Boolean },
  components: {
    FooterBlock,
    MainMenuBlock
  }
}
</script>
