<template>
  <FormHorizontal
    title="Application Accelerator"
    description="Enhance application performance by defining how cache varies based on specific request attributes."
    :isDrawer="true"
  >
    <template #inputs> </template>
  </FormHorizontal>
</template>

<script setup>
  import Accordion from 'primevue/accordion'
  import AccordionTab from 'primevue/accordiontab'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal.vue'
</script>
