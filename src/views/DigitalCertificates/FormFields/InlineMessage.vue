<!-- src/components/LetsEncryptInlineMessage.vue -->
<template>
  <InlineMessage
    class="w-fit"
    severity="info"
    v-if="show"
  >
    Create a Let's Encrypt™ digital certificate directly from
    <PrimeButton
      link
      size="small"
      class="p-0"
      @click="navigateToDomains"
    >
      {{ handleTextDomainWorkload.pluralTitle }}
    </PrimeButton>
  </InlineMessage>
</template>

<script setup>
  import PrimeButton from 'primevue/button'
  import InlineMessage from 'primevue/inlinemessage'
  import { TEXT_DOMAIN_WORKLOAD } from '@/helpers'
  import { useRouter } from 'vue-router'

  const router = useRouter()

  defineProps({
    show: {
      type: Boolean,
      required: true
    }
  })

  const handleTextDomainWorkload = TEXT_DOMAIN_WORKLOAD()

  const navigateToDomains = () => {
    router.push({ name: `list-${handleTextDomainWorkload.pluralLabel}` })
  }
</script>
