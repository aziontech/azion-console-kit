<template>
  <div class="w-full sm:w-1/2 h-[25.00rem] border surface-border rounded-md">
    <div class="p-8 flex flex-col gap-4">
      <div class="flex justify-between">
        <span class="font-medium text-lg text-color">Your Service Plan</span>
        <PrimeButton
          icon="pi pi-arrow-up-right"
          outlined
          iconPos="right"
          label="Show Other Plans"
        />
      </div>
      <div class="flex gap-4 mb-2">
        <span class="font-medium text-3xl text-color">Developer Plan</span>
        <Tag
          severity="secondary"
          value="Free Trial"
        />
      </div>
      <div class="flex justify-between">
        <span class="text-color-secondary text-sm">Plan Start Date</span>
        <span class="font-medium text-color text-sm">MM/DD/2023</span>
      </div>
      <div class="flex justify-between">
        <span class="text-color-secondary text-sm">Payment Method</span>
        <span class="font-medium text-color text-sm">Final 4242</span>
      </div>
      <div class="flex justify-between">
        <span class="text-color-secondary text-sm">Payment Currency</span>
        <span class="font-medium text-color text-sm"
          >Dollar USD (<span class="text-color-secondary text-sm">$</span>)</span
        >
      </div>
      <div class="flex justify-between">
        <span class="text-color-secondary text-sm">Credit Balance</span>
        <span><span class="text-color-secondary text-sm">$</span> 5.00</span>
      </div>
    </div>

    <Divider></Divider>

    <div class="px-8 py-4 flex flex-col gap-4">
      <p class="text-sm text-color-secondary">
        Consumptions made up to the last day of the month will be included in this invoice. Change
        <router-link
          to=""
          class="text-[var(--text-color-link)]"
          >payment methods.</router-link
        >
      </p>
    </div>
  </div>
</template>
<script setup>
  import PrimeButton from 'primevue/button'
  import Divider from 'primevue/divider'
</script>
