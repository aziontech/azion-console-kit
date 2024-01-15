<script setup>
  import PrimeButton from 'primevue/button'
  import { onMounted, ref } from 'vue'
  // const props = defineProps({})
  onMounted(() => {})
  const value2 = ref(null)
  function OpenGraphQLPlayground() {
    window.open('https://azion.com', '_blank')
  }
</script>
<template>
  <div class="flex w-full items-center flex-row">
    <div class="p-inputgroup flex flex-row grow">
      <PrimeButton
        outlined
        icon-pos="left"
        icon="pi pi-plus"
        label="Filter"
        :badge="null"
      />
      <div class="p-inputgroup-addon justify-start flex grow p-2.5">
        <p
          class="text-[color:var(--global-text-secondary-color,#666)] text-sm not-italic font-normal leading-[normal]"
        >
          Enter property name
        </p>
      </div>
    </div>
    <div class="mx-2">
      <PrimeButton
        class="h-8"
        label="Search"
        :disabled="!value2?.trim().length"
      />
    </div>
    <PrimeButton
      class="h-8 w-full max-w-fit"
      outlined
      icon-pos="right"
      icon="pi pi-external-link"
      label="Open in GraphQL Playground"
      @click="OpenGraphQLPlayground"
    />
  </div>
</template>
