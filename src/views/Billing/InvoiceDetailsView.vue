<template>
  <div class="w-full flex flex-col-reverse sm:flex-row gap-6 mt-6">
    <div
      class="w-full sm:w-1/2 h-[25.00rem] border surface-border rounded-md flex flex-col justify-between"
    >
      list table
    </div>
    <div class="w-full sm:w-1/2 flex flex-col h-[23.00rem] border surface-border rounded-md">
      <div class="p-3 md:p-6 flex flex-col gap-4">
        <div class="flex justify-between">
          <span class="font-medium text-lg text-color">Invoice Data</span>
          <PrimeButton
            icon="pi pi-download"
            outlined
            label="Export"
          />
        </div>
        <div class="flex justify-between mt-4">
          <span class="text-color-secondary text-sm">Payment Method</span>
          <span class="font-medium text-color text-sm">Final 4242</span>
        </div>
        <div class="flex justify-between">
          <span class="text-color-secondary text-sm">Billing Period</span>
          <span class="font-medium text-color text-sm">MM/DD/2024 - MM/DD/2024</span>
        </div>
        <div class="flex justify-between">
          <span class="text-color-secondary text-sm">Products Charges</span>
          <span class="text-color text-sm">
            <span class="text-color-secondary text-sm">$</span> 0.00</span
          >
        </div>
        <div class="flex justify-between">
          <span class="text-color-secondary text-sm">Professional Services Plan Charges</span>
          <span class="text-color text-sm">
            <span class="text-color-secondary text-sm">$</span> 54,005.00</span
          >
        </div>
      </div>

      <div class="p-3 md:p-6 flex flex-col gap-4 border-t surface-border">
        <div class="flex justify-between">
          <span class="text-color-secondary text-sm">Credit Used for Payment</span>
          <span class="text-color"> <span class="text-color-secondary text-sm">$</span> 5.00</span>
        </div>
        <div class="flex justify-between">
          <span class="text-color-secondary text-sm flex items-center gap-3">
            <b class="font-medium text-2xl text-color"> Total </b>
            (Amount Payable)
          </span>
          <span class="font-medium text-2xl">
            <span class="text-color-secondary text-sm font-medium">$</span> 0.00</span
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import PrimeButton from 'primevue/button'
</script>
