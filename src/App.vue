<script setup>
  import { computed, watch } from 'vue'
  import { RouterView, useRoute } from 'vue-router'
  import ShellBlock from '@/templates/shell-block'
  import { useAccountStore } from '@/stores/account'
  import { themeSelect } from '@/helpers/theme-select'
  import { storeToRefs } from 'pinia'

  const accountStore = useAccountStore()
  const { currentTheme, hasActiveUserId } = storeToRefs(accountStore)

  const route = useRoute()
  const isLogged = computed(() => {
    return hasActiveUserId && route.name !== 'login'
  })

  watch(currentTheme, (theme) => themeSelect({ theme }))
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
