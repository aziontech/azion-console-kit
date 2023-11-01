<template>
  <PrimeTag
    icon="pi pi-user"
    :pt="{ icon: { class: 'mr-0' } }"
    v-if="chartOwner === 'user'"
  />
  <PrimeTag
    icon="pi pi-users"
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
  import PrimeTag from 'primevue/tag'
  import MobileLogo from '@assets/svg/mobile-logo'

  defineProps({ chartOwner: String })
</script>
