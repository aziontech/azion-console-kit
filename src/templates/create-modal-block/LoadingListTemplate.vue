<template>
  <Skeleton class="w-52 h-8 rounded mt-4 mb-3" />
  <div class="mx-0 w-full mt-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
    <PrimeButton
      v-for="item of 8"
      :key="item"
      class="p-4 text-left border-solid border surface-border transition-all"
      link
    >
      <div class="flex flex-col h-full justify-between gap-3.5 items-start">
        <div class="flex gap-3.5 flex-col">
          <Skeleton class="w-10 h-10 rounded" />
          <div class="flex p-0.5 flex-col gap-1.5">
            <Skeleton class="w-48 h-5 rounded" />
            <Skeleton class=" w-64 h-5 rounded" />
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
