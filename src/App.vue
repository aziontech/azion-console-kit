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
