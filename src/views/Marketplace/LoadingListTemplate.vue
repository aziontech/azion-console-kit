<template>
  <div class="w-52 h-8 rounded bg-gray-200"></div>
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
            <div class="w-10 h-10 rounded bg-gray-200"></div>
            <div class="flex p-0.5 flex-col gap-1.5">
              <span class="w-48 pb-5 rounded bg-gray-200"> </span>
              <span class="w-60 pb-5 rounded bg-gray-200"> </span>
              <span class="w-32 pb-5 rounded bg-gray-200"> </span>
            </div>
          </div>
        </div>
      </template>
    </PrimeCard>
  </div>
  <div class="w-52 h-6 rounded mb-1 bg-gray-200"></div>
  <div class="ml-0 w-full grid grid-cols-3 gap-4">
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
            <div class="w-10 h-10 rounded bg-gray-200"></div>
            <div class="flex p-0.5 flex-col gap-1.5">
              <span class="w-48 pb-5 rounded bg-gray-200"> </span>
              <span class="w-60 pb-5 rounded bg-gray-200"> </span>
              <span class="w-32 pb-5 rounded bg-gray-200"> </span>
            </div>
          </div>
        </div>
      </template>
    </PrimeCard>
  </div>
</template>

<script setup>
  import PrimeCard from 'primevue/card'
</script>
