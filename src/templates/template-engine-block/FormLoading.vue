<template>
  <div
    class="flex max-w-screen-2xl mx-auto gap-8 lg:gap-16 w-full surface-section rounded-md border surface-border px-8 py-8 xl:py-14 xl:p-14 flex-wrap"
  >
    <div class="flex flex-col gap-2 flex-1 w-full md:min-w-[20rem]">
      <Skeleton class="h-7 w-44" />
    </div>
    <div class="max-w-3xl w-full flex flex-col gap-8 max-md:gap-6">
      <div
        class="flex flex-col sm:max-w-lg w-full gap-2"
        v-for="item of 4"
        :key="item"
      >
        <Skeleton class="h-6 w-16" />
        <Skeleton class="h-8" />
      </div>
    </div>
  </div>
</template>

<script setup>
  import Skeleton from 'primevue/skeleton'
</script>
