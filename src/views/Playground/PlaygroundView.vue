<template>
  <div class="flex flex-col gap-10 max-w-screen-xl mx-auto">
    <div class="mt-10 flex flex-col gap-10">
      <InlineMessage severity="info"
        >Please save this secret key in a secure and easily accessible location. For security
        reasons, you won't be able to view it again through your Azion account. If you lose this
        secret key, you'll need to generate a new one.</InlineMessage
      >
      <InlineMessage severity="success"
        >Please save this secret key in a secure and easily accessible location. For security
        reasons, you won't be able to view it again through your Azion account. If you lose this
        secret key, you'll need to generate a new one.</InlineMessage
      >
      <InlineMessage severity="error"
        >Please save this secret key in a secure and easily accessible location. For security
        reasons, you won't be able to view it again through your Azion account. If you lose this
        secret key, you'll need to generate a new one.</InlineMessage
      >
      <InlineMessage severity="warn"
        >Please save this secret key in a secure and easily accessible location. For security
        reasons, you won't be able to view it again through your Azion account. If you lose this
        secret key, you'll need to generate a new one.</InlineMessage
      >
    </div>

    <div class="flex gap-4 h-10">
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
  import InlineMessage from 'primevue/inlinemessage'
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
