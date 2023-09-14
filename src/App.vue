<script setup>
  import { RouterView } from 'vue-router'
  import ShellBlock from '@/templates/shell-block'
</script>

<template>
  <main class="flex flex-col min-h-screen">
    <ShellBlock v-slot:default="{ customClass }">
      <RouterView
        :class="customClass"
        class="w-full transition-[width] duration-300 ease-in-out"
      />
    </ShellBlock>
  </main>
</template>
