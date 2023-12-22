<template>
  <div class="mx-auto max-w-[720px] items-center text-center gap-6">
    <div
      style="background: linear-gradient(to bottom, var(--surface-200) 0%, transparent 100%)"
      class="p-4 rounded-md"
    >
      <i
        class="pi pi-times"
        style="color: var(--red-400); font-size: 2rem"
      ></i>
    </div>
    <h1 class="text-3xl lg:text-4xl text-medium">Azion CLI Authentication Failed</h1>
    <p class="mx-8 text-lg text-color-secondary">
      Unable to authenticate the Azion CLI with the provided credentials. Please double-check your
      account details and try again.
    </p>

    <p class="mx-8 text-lg text-color-secondary">
      For assistance, you can refer to the documentation or contact Azion support.
    </p>
  </div>
</template>

<script>
  export default {
    name: 'cli-callback-fail-view'
  }
</script>
