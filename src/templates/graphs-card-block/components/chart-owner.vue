<template>
  <PrimeTag
    icon="pi pi-user"
    severity="info"
    :pt="{ icon: { class: 'mr-0' } }"
    v-if="chartOwner === 'user'"
  />
  <PrimeTag
    icon="pi pi-users"
    severity="info"
    :pt="{ icon: { class: 'mr-0' } }"
    v-if="chartOwner === 'account'"
  />
  <PrimeTag
    :pt="{ icon: { class: 'mr-0' } }"
    v-if="chartOwner === 'azion'"
  >
    <MobileLogo class="w-3 h-3" />
  </PrimeTag>
</template>

<script setup>
  import MobileLogo from '@assets/svg/mobile-logo'
  import PrimeTag from 'primevue/tag'

  defineProps({ chartOwner: String })
</script>
