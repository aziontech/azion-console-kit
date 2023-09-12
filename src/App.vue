<script setup>
import { RouterView } from 'vue-router'
import ShellBlock from '@/templates/shell-block'
import { useRoute } from 'vue-router'
import { computed } from 'vue';

const route = useRoute()
const isLogin = computed(() => {
  return route.path === '/login'
})
</script>

<template>
  <main :class="['flex min-h-screen', !isLogin ? 'flex-col' : 'items-center']">
    <ShellBlock v-if="!isLogin">
      <RouterView />
    </ShellBlock>

    <RouterView v-else />
  </main>
</template>
