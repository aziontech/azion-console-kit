<script setup>
  import { computed, provide, watch } from 'vue'
  import { RouterView, useRoute } from 'vue-router'
  import ShellBlock from '@/templates/shell-block'
  import { useAccountStore } from '@/stores/account'
  import { storeToRefs } from 'pinia'
  import { isRoutePublic } from '@/router/public-routes'
  import { themeSelect, useCreateBoardManager } from '@/helpers'

  const accountStore = useAccountStore()
  const { currentTheme, hasActiveUserId } = storeToRefs(accountStore)

  const route = useRoute()
  const isLogged = computed(() => {
    return hasActiveUserId && !isRoutePublic(route.name)
  })

  watch(currentTheme, (theme) => themeSelect({ theme }))

  provide('createBoardManager', useCreateBoardManager())
</script>

<template>
  <main class="flex flex-col">
    <ShellBlock
      v-slot:default="{ customClass }"
      :isLogged="isLogged"
    >
      <RouterView
        :class="customClass"
        class="w-full flex flex-col max-w-full transition-[width] duration-300 ease-in-out"
      />
    </ShellBlock>
  </main>
</template>
