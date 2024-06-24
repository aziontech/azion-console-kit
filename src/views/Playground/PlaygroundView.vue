<template>
  <div class="flex flex-col gap-10 max-w-screen-xl mx-auto">
    <div class="flex gap-4 h-10 mt-10">
      <PrimeButton
        label="Show toast 5s"
        severity="secondary"
        @click="showToast(5)"
      />
      <PrimeButton
        label="Show toast 10s"
        severity="secondary"
        @click="showToast(10)"
      />
      <PrimeButton
        label="Show toast 15s"
        severity="secondary"
        @click="showToast(15)"
      />
    </div>
  </div>
</template>

<script setup>
  import PrimeButton from 'primevue/button'
  import { useToast } from 'primevue/usetoast'

  const toast = useToast()

  const secondsToMilliseconds = (seconds) => {
    return seconds * 1000
  }

  const showToast = (life) => {
    const options = {
      closable: true,
      severity: 'success',
      summary: 'success',
      detail: `Show toast ${life}s`,
      life: secondsToMilliseconds(life)
    }

    toast.add(options)
  }
</script>
