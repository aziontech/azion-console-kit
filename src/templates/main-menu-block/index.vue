<template>
  <NavBarBlock :userIsLogged="props.isLogged" />
</template>

<script setup>
  import NavBarBlock from '@templates/navbar-block'

  defineOptions({ name: 'main-menu-block' })

  const props = defineProps({
    isLogged: {
      type: Boolean,
      required: true
    }
  })
</script>
