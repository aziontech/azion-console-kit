<template>
  <div
    class="w-full sm:w-1/2 flex flex-col justify-between h-[25.00rem] border surface-border rounded-md"
  >
    <div class="p-8 flex flex-col gap-4">
      <div class="flex justify-between">
        <span class="font-medium text-lg text-color">Current Invoice</span>
        <PrimeButton
          icon="pi pi-file"
          outlined
          label="Details"
        />
      </div>
      <div class="flex justify-between mt-4">
        <span class="text-color-secondary text-sm">Billing Period</span>
        <span class="font-medium text-color text-sm">MM/DD/2024 - MM/DD/2024</span>
      </div>
      <div class="flex justify-between">
        <span class="text-color-secondary text-sm">Products Charges</span>
        <span class="text-color text-sm"
          ><span class="text-color-secondary text-sm"
            ><span class="text-color-secondary text-sm">$</span></span
          >
          5.00</span
        >
      </div>
      <div class="flex justify-between">
        <span class="text-color-secondary text-sm">Professional Services Plan Charges</span>
        <span class="text-color text-sm">
          <span class="text-color-secondary text-sm">$</span> 0.00</span
        >
      </div>
    </div>
    <Divider></Divider>
    <div class="p-8 flex flex-col gap-4">
      <div class="flex justify-between">
        <span class="text-color-secondary text-sm">Credit Used for Payment</span>
        <span class="text-color"> <span class="text-color-secondary text-sm">$</span> 5.00</span>
      </div>
      <div class="flex justify-between">
        <span class="text-color-secondary text-sm">
          <b class="font-medium text-2xl text-color">Total</b> (Amount Payable)</span
        >
        <span class="font-medium text-2xl">
          <span class="text-color-secondary text-sm font-medium">$</span> 0.00</span
        >
      </div>
    </div>
  </div>
</template>
<script setup>
  import PrimeButton from 'primevue/button'
  import Divider from 'primevue/divider'
</script>
