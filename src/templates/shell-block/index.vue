<template>
  <MenuBlock />
  <div class="flex-grow">
    <slot></slot>
  </div>
  <FooterBlock />
</template>

<script>
import MenuBlock from '@/templates/menu-block'
import FooterBlock from '@/templates/footer-block'

export default {
  name: 'shell-block',
  components: {
    FooterBlock,
    MenuBlock,
  }
}
</script>