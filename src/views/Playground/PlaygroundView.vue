
<template>
  <div class="p-20 flex flex-col">
    <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="customHeaders"
          class="text-color text-base font-medium"
          >Custom Headers</label
        >
        <InputGroup>
          <InputText
            id="header-value"
            placeholder="Value"
          />
          <PrimeButton
            icon="pi pi-trash"
            outlined
          />
      </InputGroup>
    </div>
    <Divider layout="vertical">
      teste
    </Divider>
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="customHeaders"
          class="text-color text-base font-medium"
          >Custom Headers</label
        >
        <InputGroup>
          <InputText
            id="header-value"
            placeholder="Value"
          />
          <PrimeButton
            icon="pi pi-trash"
            outlined
          />
      </InputGroup>
    </div>
  </div>
</template>
  
<script setup>
  import Divider from 'primevue/divider';
  import PrimeButton from 'primevue/button';
  import InputText from 'primevue/inputtext';
  import InputGroup from 'primevue/inputgroup';
</script>
