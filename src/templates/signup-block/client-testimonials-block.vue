<template>
  <div class="flex flex-col gap-16 md:max-w-[672px]">
    <p class="text-color-secondary text-center">
      Trusted by market leaders across banking, e-commerce, tech, and other industries.
    </p>
    <Carousel
      :value="listTestimonials"
      :numVisible="1"
      :circular="false"
      :showNavigators="false"
      :showIndicators="false"
      :autoplayInterval="timeToNextSlideInMs"
    >
      <template #item="slotProps">
        <div class="flex flex-col gap-2">
          <div class="text-xl md:text-3xl font-medium text-center">
            <q> {{ slotProps.data.testimonial }} </q>
          </div>
          <div class="text-color-secondary text-center">
            {{ slotProps.data.name }}, {{ slotProps.data.position }}
          </div>
        </div>
        <div class="flex justify-center mt-16">
          <component :is="slotProps.data.logo" />
        </div>
      </template>
    </Carousel>
  </div>
</template>

<script setup>
  import Carousel from 'primevue/carousel'
  import Axur from '@/assets/svg/axur-logo.vue'
  import { h, ref } from 'vue'
  const timeToNextSlideInMs = 10000

  const listTestimonials = ref([
    {
      name: 'Fabio Ramos',
      position: 'CEO of Axur',
      testimonial: `With Azion, we can scale our proprietary AI models without worrying about infrastructure. Inspecting millions of websites daily, performing the fastest takedown in the market.`,
      logo: h(Axur)
    }
  ])
</script>
