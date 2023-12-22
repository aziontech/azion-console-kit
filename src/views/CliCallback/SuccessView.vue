<template>
  <div class="mx-auto max-w-[720px] items-center text-center gap-6">
    <div
      style="background: linear-gradient(to bottom, var(--surface-200) 0%, transparent 100%)"
      class="p-4 rounded-md"
    >
      <i
        class="pi pi-check"
        style="color: var(--green-500); font-size: 2rem"
      ></i>
    </div>
    <h1 class="mx-8 text-3xl lg:text-4xl text-medium">Azion CLI Authentication Successfull</h1>
    <p class="mx-8 text-lg text-color-secondary">
      You've successfully authenticated the Azion CLI.
    </p>
    <p class="mx-8 text-lg text-color-secondary">You can now close this tab.</p>
  </div>
</template>

<script>
  export default {
    name: 'cli-callback-success-view',
    PrimeButton
  }

  import PrimeButton from 'primevue/button'
</script>
