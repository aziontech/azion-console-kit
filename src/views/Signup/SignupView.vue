<template>
  <div>
    <section class="flex flex-col md:flex-row p-3 md:p-6 2xl:p-10 gap-10 md:gap-20 2xl:gap-40 justify-center">
      <div
        class="flex flex-col items-center justify-center"
      >
        <form-signup-block v-bind="props" />
      </div>
      <div
        class="flex flex-col items-center justify-center"
      >
        <div>
          <client-testimonials-block />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
  import FormSignupBlock from '@/templates/signup-block/form-signup-block.vue'
  import ClientTestimonialsBlock from '@/templates/signup-block/client-testimonials-block'

  const props = defineProps({
    signupService: { required: true, type: Function },
    listSocialIdpsService: { required: true, type: Function },
    resendEmailService: { required: true, type: Function }
  })
</script>
