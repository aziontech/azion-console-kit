<template>
  <PrimeTag
    class="bg-purple-100 text-black"
    icon="pi pi-user"
    :pt="{ icon: { class: 'mr-0' } }"
    v-if="chartOwner === 'user'"
  />
  <PrimeTag
    class="bg-green-100 text-black"
    icon="pi pi-users"
    :pt="{ icon: { class: 'mr-0' } }"
    v-if="chartOwner === 'account'"
  />
  <PrimeTag
    class="bg-orange-100 text-black"
    :pt="{ icon: { class: 'mr-0' } }"
    v-if="chartOwner === 'azion'"
  >
    <MobileLogo
      class="w-3 h-3"
      fill="#111111"
    />
  </PrimeTag>
</template>

<script setup>
  import PrimeTag from 'primevue/tag'
  import MobileLogo from '@assets/svg/mobile-logo'

  defineProps({ chartOwner: String })
</script>
