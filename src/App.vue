<script setup>
  import { computed, watch } from 'vue'
  import { RouterView, useRoute } from 'vue-router'
  import ShellBlock from '@/templates/shell-block'
  import { useAccountStore } from '@/stores/account'
  import { themeSelect } from '@/helpers/themeSelect'
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
  <main class="flex flex-col">
    <ShellBlock
      v-slot:default="{ customClass }"
      :isLogged="isLogged"
    >
      <RouterView
        :class="customClass"
        class="w-full transition-[width] duration-300 ease-in-out h-full"
      />
    </ShellBlock>
  </main>
</template>

<style>
  /* https://github.com/primefaces/primevue/issues/882#issuecomment-1780802552 */
  body.p-overflow-hidden {
    --scrollbar-width: 0px !important;
  }
</style>
