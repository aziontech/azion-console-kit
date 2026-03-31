<template>
  <section
    class="flex flex-col md:flex-row p-3 md:p-6 2xl:p-10 gap-10 md:gap-20 2xl:gap-40 justify-center"
  >
    <div class="flex flex-col items-center justify-center">
      <form-signup-block v-bind="props" />
    </div>
    <div class="flex flex-col items-center justify-center">
      <div>
        <testimonials-carousel :testimonials="testimonials" />
      </div>
    </div>
  </section>
</template>

<script setup>
  import FormSignupBlock from '@/templates/signup-block/form-signup-block.vue'
  import TestimonialsCarousel from '@aziontech/webkit/testimonials-carousel'
  import Axur from '@/assets/svg/axur-logo.vue'
  import { h, onMounted } from 'vue'
  import { usePlans } from '@/composables/usePlans'

  const { initialize } = usePlans()

  const props = defineProps({
    signupService: { required: true, type: Function },
    resendEmailService: { required: true, type: Function }
  })

  const testimonials = [
    {
      name: 'Fabio Ramos',
      position: 'CEO of Axur',
      testimonial:
        'With Azion, we can scale our proprietary AI models without worrying about infrastructure. Inspecting millions of websites daily, performing the fastest takedown in the market.',
      logo: h(Axur)
    }
  ]

  onMounted(() => {
    initialize()
  })
</script>
