<template>
  <MainMenuBlock />
  <div class="flex-grow">
    <slot></slot>
  </div>
  <FooterBlock />
</template>

<script>
import MainMenuBlock from '@/templates/main-menu-block'
import FooterBlock from '@/templates/footer-block'

export default {
  name: 'shell-block',
  components: {
    FooterBlock,
    MainMenuBlock
  }
}
</script>
