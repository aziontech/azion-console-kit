<template>
  <div class="flex items-center gap-3">
    {{ props.expiringDate }}
    <PrimeTag
      severity="warning"
      :value="props.status"
      v-if="props.status"
    />
  </div>
</template>

<script setup>
  import PrimeTag from 'primevue/tag'

  const props = defineProps({
    expiringDate: {
      type: String,
      required: true
    },
    status: {
      type: String,
      required: false
    }
  })
</script>
