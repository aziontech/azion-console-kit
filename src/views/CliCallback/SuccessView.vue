<template>
  <div class="mx-auto max-w-[720px] items-center text-center gap-6">
    <div style="background: linear-gradient(to bottom, var(--surface-200) 0%, transparent 100%);" class=" p-4 rounded-md">
      <i class="pi pi-check" style="color:var(--green-500); font-size: 2rem;"></i>
    </div>
    <h1 class="mx-8 text-3xl lg:text-4xl text-medium">Azion CLI Authentication Successfull</h1>
    <p class="mx-8 text-lg text-color-secondary">You've successfully authenticated the Azion CLI with the following account:
    </p>
    <span class="p-4 text-lg font-robotomono text-color-link surface-200">alessandro.cauduro@gmail.com</span>
    <p class="mx-8 text-lg text-color-secondary">you can now close this tab and return to the CLI.
    </p>
  </div>
</template>

<script>
export default {
  name: 'cli-callback-success-view',
  PrimeButton,
}


import PrimeButton from 'primevue/button';


</script>
