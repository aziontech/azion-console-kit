<script setup>
import { computed } from 'vue';
import { RouterView } from 'vue-router'
import ShellBlock from '@/templates/shell-block'
import { useAccountStore } from '@/stores/account'

const accountStore = useAccountStore()
const isLogged = computed(() => {
  return accountStore.hasActiveUserId
})
</script>

<template>
  <main class="flex min-h-screen flex-col">
    <ShellBlock :isLogged="isLogged">
      <RouterView />
    </ShellBlock>
  </main>
</template>
