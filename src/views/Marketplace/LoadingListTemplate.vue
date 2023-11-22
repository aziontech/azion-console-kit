<template>
  <!-- <div class="w-52 h-8 rounded bg-gray-200"></div> -->
  <Skeleton class="w-52 h-8 rounded" />
  <div class="ml-0 w-full mt-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    <PrimeCard
      v-for="item of 12"
      :key="item"
      :pt="{
        root: 'p-4 flex-shrink basis-6/12',
        body: 'w-full h-full',
        content: 'h-full'
      }"
    >
      <template #content>
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
      </template>
    </PrimeCard>
  </div>
  <Skeleton class="w-52 h-6 rounded" />
  <div class="ml-0 w-full mt-0 grid grid-cols-3 gap-4">
    <PrimeCard
      v-for="item of 6"
      :key="item"
      :pt="{
        root: 'p-4 flex-shrink basis-6/12',
        body: 'w-full h-full',
        content: 'h-full'
      }"
    >
      <template #content>
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
      </template>
    </PrimeCard>
  </div>
</template>

<script setup>
  import PrimeCard from 'primevue/card'
  import Skeleton from 'primevue/skeleton'
</script>
