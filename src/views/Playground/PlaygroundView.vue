<template>
  <div class="flex align-middle justify-center py-10">
    <div class=" w-72  flex flex-col gap-10">
      <Menu class="w-full" :model="items" />
      <Dropdown v-model="cities" :options="cities" optionLabel="name" placeholder="Select a City" />
      <Dropdown v-model="selectedCity" :options="groupedCities" optionLabel="label" optionGroupLabel="label"
        optionGroupChildren="items" placeholder="Select a City" />
    </div>
  </div>
</template>

<script setup>


import Menu from 'primevue/menu';
import Dropdown from 'primevue/dropdown';
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const items = ref([
  { label: 'Account Settings' },
  { label: 'Users Management' },
  { label: 'Billing & Subscriptions' },
  { label: 'Credentials' },
  { label: 'Activity History' },
  { label: 'Teams Permissions' },
]);

const cities = ref([
  { name: 'New York', code: 'NY' },
  { name: 'Rome', code: 'RM' },
  { name: 'London', code: 'LDN' },
  { name: 'Istanbul', code: 'IST' },
  { name: 'Paris', code: 'PRS' }
]);

const groupedCities = ref([
  {
    label: 'Germany',
    code: 'DE',
    items: [
      { label: 'Berlin', value: 'Berlin' },
      { label: 'Frankfurt', value: 'Frankfurt' },
      { label: 'Hamburg', value: 'Hamburg' },
      { label: 'Munich', value: 'Munich' }
    ]
  },
  {
    label: 'USA',
    code: 'US',
    items: [
      { label: 'Chicago', value: 'Chicago' },
      { label: 'Los Angeles', value: 'Los Angeles' },
      { label: 'New York', value: 'New York' },
      { label: 'San Francisco', value: 'San Francisco' }
    ]
  },
  {
    label: 'Japan',
    code: 'JP',
    items: [
      { label: 'Kyoto', value: 'Kyoto' },
      { label: 'Osaka', value: 'Osaka' },
      { label: 'Tokyo', value: 'Tokyo' },
      { label: 'Yokohama', value: 'Yokohama' }
    ]
  }
]);
</script>
