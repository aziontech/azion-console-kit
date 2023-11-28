<template>
  <div class="p-20">
    <div class="flex flex-col sm:max-w-lg w-full gap-2">
      <label
        for="customHeaders"
        class="text-color text-base font-medium"
        >Custom Headers</label
      >
      <div class="p-inputgroup">
        <InputText
          id="header-value"
          placeholder="Value"
        />
        <PrimeButton
          icon="pi pi-trash"
          outlined
        />
      </div>
    </div>
  </div>
</template>

<script setup>
  import PrimeButton from 'primevue/button'
  import InputText from 'primevue/inputtext'
</script>
