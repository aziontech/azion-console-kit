<template>
  <div class="w-full py-6 px-8 flex flex-col gap-4">
    <!-- Breadcrumbs -->
    <Breadcrumb :model="itemsbread" class="-ml-1" />

    <!-- TabView -->
    <div class="flex mx-auto w-full">
      <TabView
        :scrollable="true"
        class="w-full"
      >
        <TabPanel header="Main Settings">
          <div class="p-4">
            <p>Tab 1</p>
          </div>
        </TabPanel>
        <TabPanel header="Origins">
          <div class="p-4">
            <p>Tab 2</p>
          </div>
        </TabPanel>
        <TabPanel header="Rules Engine">
          <div class="p-4">
            <p>Tab 3</p>
          </div>
        </TabPanel>
        <TabPanel header="Rules Engine">
          <div class="p-4">
            <p>Tab 3</p>
          </div>
        </TabPanel>
        <TabPanel header="Rules Engine">
          <div class="p-4">
            <p>Tab 3</p>
          </div>
        </TabPanel>
        <TabPanel header="Rules Engine">
          <div class="p-4">
            <p>Tab 3</p>
          </div>
        </TabPanel>
        <TabPanel header="Rules Engine">
          <div class="p-4">
            <p>Tab 3</p>
          </div>
        </TabPanel>
        <TabPanel header="Rules Engine">
          <div class="p-4">
            <p>Tab 3</p>
          </div>
        </TabPanel>
        <TabPanel header="Rules Engine">
          <div class="p-4">
            <p>Tab 3</p>
          </div>
        </TabPanel>
        <TabPanel header="Rules Engine">
          <div class="p-4">
            <p>Tab 3</p>
          </div>
        </TabPanel>
        <TabPanel header="Rules Engine">
          <div class="p-4">
            <p>Tab 3</p>
          </div>
        </TabPanel>
        <TabPanel header="Rules Engine">
          <div class="p-4">
            <p>Tab 3</p>
          </div>
        </TabPanel>
        <TabPanel header="Rules Engine">
          <div class="p-4">
            <p>Tab 3</p>
          </div>
        </TabPanel>
        <TabPanel header="Rules Engine">
          <div class="p-4">
            <p>Tab 3</p>
          </div>
        </TabPanel>
        <TabPanel header="Rules Engine">
          <div class="p-4">
            <p>Tab 3</p>
          </div>
        </TabPanel>
        <TabPanel header="Rules Engine">
          <div class="p-4">
            <p>Tab 3</p>
          </div>
        </TabPanel>
      </TabView>
    </div>

    <!-- SelectButton -->
    <div class="flex mx-auto w-full justify-end gap-2 items-center">
      <SelectButton
        v-model="value"
        :options="options"
        aria-labelledby="basic"
      />
      <PrimeButton label="Rule Set" icon="pi pi-plus" size="small"/>
    </div>

    <!-- Menu -->
    <Menu class="w-[20rem]" :model="items" />

    <!-- Dropdowns -->
    <Dropdown
      class="w-full md:w-[20rem]"
      v-model="selectedCity"
      :options="cities"
      optionLabel="name"
      placeholder="Select a City"
    />
    <Dropdown
      class="w-full md:w-[20rem]"
      v-model="selectedGroupedCity"
      :options="groupedCities"
      optionLabel="label"
      optionGroupLabel="label"
      optionGroupChildren="items"
      placeholder="Select a City"
    />
  </div>
</template>

<script setup>
import Menu from 'primevue/menu';
import Dropdown from 'primevue/dropdown';
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import SelectButton from 'primevue/selectbutton'
import Breadcrumb from 'primevue/breadcrumb';
import PrimeButton from 'primevue/button';

import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const itemsbread = ref([
    {label: 'Page Name'},
    {label: 'Page Name'},
    {label: 'Current Page'},
]);

const value = ref('All phases');
const options = ref(['All phases', 'Request', 'Response']);

const items = ref([
  { label: 'Account Settings' },
  { label: 'Users Management' },
  { label: 'Billing & Subscriptions' },
  { label: 'Credentials' },
  { label: 'Activity History' },
  { label: 'Teams Permissions' },
]);

const selectedCity = ref();
const cities = ref([
    { name: 'New York', code: 'NY' },
    { name: 'Rome', code: 'RM' },
    { name: 'London', code: 'LDN' },
    { name: 'Istanbul', code: 'IST' },
    { name: 'Paris', code: 'PRS' }
]);

const selectedGroupedCity = ref();
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
