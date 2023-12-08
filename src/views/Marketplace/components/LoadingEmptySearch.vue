<template>
  <div class="ml-0 w-full mt-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative">
    <div
      class="h-72 w-full bg-gradient-to-t text-[var(--surface-section)] from-current absolute z-10 bottom-0 left-0"
    ></div>
    <PrimeButton
      v-for="item of 9"
      :key="item"
      class="p-4 text-left border-solid border surface-border transition-all"
      link
    >
      <div class="flex flex-col w-full h-full justify-between gap-3.5 items-start">
        <div class="flex w-full gap-3.5 flex-col">
          <div class="w-10 h-10 rounded bg-gray-200"></div>
          <div class="flex p-0.5 flex-col gap-1.5">
            <div class="max-w-[12rem] h-5 rounded bg-gray-200"></div>
            <div class="max-w-[15rem] h-5 rounded bg-gray-200"></div>
            <div class="max-w-[8rem] h-5 rounded bg-gray-200"></div>
          </div>
        </div>
      </div>
    </PrimeButton>
  </div>
</template>

<script setup>
  import PrimeButton from 'primevue/button'
</script>
