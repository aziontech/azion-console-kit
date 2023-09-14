<script setup>
import { RouterView, useRoute } from 'vue-router'
import ShellBlock from '@/templates/shell-block'
import { computed } from 'vue';

const route = useRoute()
const isLogin = computed(() => {
  return route.path === '/login'
})
</script>

<template>
  <main :class="['flex min-h-screen', !isLogin ? 'flex-col' : 'items-center']">
    <RouterView v-if="isLogin" />
    <ShellBlock v-else>
      <RouterView />
    </ShellBlock>
  </main>
</template>
