<template>
  <div class="flex flex-col p-10 items-center justify-center gap-2">
    <PrimeButton label="Primary"></PrimeButton>
    <PrimeButton severity="secondary" label="Secondary"></PrimeButton>
    <PrimeButton plain text label="Tertiary"></PrimeButton>
    <PrimeButton link label="Link"></PrimeButton>
    <PrimeButton outlined label="Outlined"></PrimeButton>
    <InputText placeholder="Placeholder"></InputText>
    <InputSwitch class="flex-none" v-model="checked" />
    <RadioButton></RadioButton>
  </div>
</template>

<script setup>
import PrimeButton from 'primevue/button';
import InputText from 'primevue/inputtext'
import InputSwitch from 'primevue/inputswitch';

import { ref } from 'vue';
const checked = ref(false);

</script>
