<script setup>
  import { computed } from 'vue'
  import { RouterView, useRoute } from 'vue-router'
  import ShellBlock from '@/templates/shell-block'
  import { useAccountStore } from '@/stores/account'

  const accountStore = useAccountStore()
  const route = useRoute()

  const isLogged = computed(() => {
    return accountStore.hasActiveUserId && route.name !== 'login'
  })
</script>

<template>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
  <main class="flex min-h-screen flex-col">
    <ShellBlock
      v-slot:default="{ customClass }"
      :isLogged="isLogged"
    >
      <RouterView
        :class="customClass"
        class="w-full transition-[width] duration-300 ease-in-out"
      />
    </ShellBlock>
  </main>
</template>
