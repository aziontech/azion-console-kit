<script setup>
  import { computed, watch } from 'vue'
  import { RouterView, useRoute } from 'vue-router'
  import ShellBlock from '@/templates/shell-block'
  import { useAccountStore } from '@/stores/account'
  import { storeToRefs } from 'pinia'
  import { themeSelect } from '@/helpers'

  const accountStore = useAccountStore()
  const { currentTheme, hasActiveUserId } = storeToRefs(accountStore)

  const route = useRoute()
  const isLogged = computed(() => {
    // evaluating as !route.meta?.hideNavigation will cause navbar to flicker
    return route.meta.hideNavigation !== true && hasActiveUserId.value
  })

  watch(currentTheme, (theme) => themeSelect({ theme }))
</script>

<template>
  <div class="flex flex-col">
    <ShellBlock
      v-slot:default="{ customClass }"
      :isLogged="isLogged"
    >
      <RouterView
        :class="customClass"
        class="w-full flex flex-col max-w-full transition-[width] duration-300 ease-in-out"
      />
    </ShellBlock>
  </div>
</template>
