<template>
  <div class="flex flex-wrap p-10 items-center justify-center gap-2">
    <PrimeButton label="Primary"></PrimeButton>
    <PrimeButton severity="secondary" label="Secondary"></PrimeButton>
    <PrimeButton plain text label="Tertiary"></PrimeButton>
    <PrimeButton link label="Link"></PrimeButton>
    <PrimeButton outlined label="Outlined"></PrimeButton>
    <InputText placeholder="Placeholder"></InputText>
    <InputSwitch class="flex-none" v-model="checked" />
    <Tag value="Primary"></Tag>
    <Tag severity="success" value="Success"></Tag>
    <Tag severity="info" value="Info"></Tag>
    <Tag severity="warning" value="Warning"></Tag>
    <Tag severity="danger" value="Danger"></Tag>
    <RadioButton v-model="active" value="Radio Button" />
    <Checkbox inputId="checkbox" v-model="selected" :binary="true" />
    <Checkbox inputId="checkbox1" v-model="marked" :binary="true" />

  </div>
</template>

<script setup>
import PrimeButton from 'primevue/button';
import InputText from 'primevue/inputtext'
import InputSwitch from 'primevue/inputswitch';
import Checkbox from 'primevue/checkbox';
import Tag from 'primevue/tag';
import RadioButton from 'primevue/radiobutton';


import { ref } from "vue";
const checked = ref(false);
const selected = ref(false);
const marked = ref(false);
const active = ref('');

</script>
