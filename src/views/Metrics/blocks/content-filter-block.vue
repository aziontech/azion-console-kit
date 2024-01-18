<script setup>
  import PrimeButton from 'primevue/button'

  const props = defineProps({
    playgroundOpener: {
      type: Function,
      required: true
    }
  })
</script>
<template>
  <div class="flex w-full items-center flex-column gap-4 md:gap-2 md:flex-row">
    <div class="p-inputgroup flex flex-row grow">
      <PrimeButton
        outlined
        icon-pos="left"
        icon="pi pi-plus"
        label="Filter"
        :disabled="true"
      />
      <div class="p-inputgroup-addon justify-start flex grow p-2.5">
        <p class="text-secondary text-sm not-italic font-normal leading-[normal]">
          !!!Under development!!!
        </p>
      </div>
    </div>
    <PrimeButton
      class="h-8 w-full md:max-w-max"
      label="Search"
      :disabled="true"
    />
    <PrimeButton
      class="h-8 w-full md:max-w-fit"
      outlined
      icon-pos="right"
      icon="pi pi-external-link"
      label="Open in GraphQL Playground"
      @click="props.playgroundOpener()"
      :disabled="true"
    />
  </div>
</template>
