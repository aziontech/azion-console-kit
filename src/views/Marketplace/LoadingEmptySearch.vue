<template>
  <div class="ml-0 w-full mt-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative">
    <div
      class="h-72 w-full bg-gradient-to-t text-[var(--surface-section)] from-current absolute z-10 bottom-0 left-0"
    ></div>
    <PrimeButton
      v-for="item of 9"
      :key="item"
      class="p-4 text-left border-solid border surface-border hover:border-primary transition-all"
      link
    >
      <div class="flex flex-col h-full justify-between gap-3.5 items-start">
        <div class="flex gap-3.5 flex-col">
          <Skeleton class="w-10 h-10 rounded" />
          <div class="flex p-0.5 flex-col gap-1.5">
            <Skeleton class="w-48 h-5 rounded" />
            <Skeleton class="w-60 h-5 rounded" />
            <Skeleton class="w-32 h-5 rounded" />
          </div>
        </div>
      </div>
    </PrimeButton>
  </div>
</template>

<script setup>
  import PrimeButton from 'primevue/button'
  import Skeleton from 'primevue/skeleton'
</script>
