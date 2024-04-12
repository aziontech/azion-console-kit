<template>
  <div>
    <section class="flex max-lg:flex-col">
      <div
        class="w-auto flex flex-col items-center justify-center p-6 lg:p-20 max-md:px-3 max-md:pt-4 max-md:pb-8"
      >
        <form-signup-block v-bind="props" />
      </div>
      <div
        class="w-full flex flex-col items-center justify-center p-20 lg:p-10 max-md:px-3 max-md:pt-4 max-md:pb-8"
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
