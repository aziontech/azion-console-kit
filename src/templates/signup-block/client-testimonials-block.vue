<template>
  <Carousel
    :value="listTestimonials"
    :numVisible="1"
    :numScroll="1"
    circular
    :showNavigators="false"
    :showIndicators="false"
    :autoplayInterval="3000"
  >
    <template #item="slotProps">
      <div class="mb-3 font-medium">{{ slotProps.data.name }}</div>
      <div class="mb-3 font-medium">{{ slotProps.data.position }}</div>
      <div class="mb-3 font-medium">{{ slotProps.data.testimonial }}</div>
    </template>
  </Carousel>
</template>

<script setup>
  import Carousel from 'primevue/carousel'
  import { ref } from 'vue'

  const listTestimonials = ref([
    {
      name: 'John Doe',
      position: 'CEO',
      testimonial:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
    },
    {
      name: 'Jane Doe',
      position: 'CTO',
      testimonial: 'lorem ipsum dolor sit amet, consectetur adipiscing elit.'
    },
    {
      name: 'John Doe',
      position: 'CEO',
      testimonial: 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
    }
  ])
</script>
