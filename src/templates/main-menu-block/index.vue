<template>
  <NavBarBlock :showNavItems="showNavItems" />
</template>

<script setup>
  import NavBarBlock from '@templates/navbar-block'

  defineOptions({ name: 'main-menu-block' })

  defineProps({ showNavItems: Boolean })
</script>
