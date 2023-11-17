<template>
  <PageWithFormBlock
    :pageTitle="pageTitle"
    :benefitsList="benefitsList"
    :formTitle="formTitle"
    class="animate-fadeIn"
  >
    <template #form>
      <SocialSignupBlock
        v-if="!showEmailForm"
        @change-signup-method="showEmailForm = true"
      />
      <FormSignupBlock
        v-else
        :signupService="signupService"
        @change-signup-method="showEmailForm = false"
      />
    </template>
  </PageWithFormBlock>
</template>

<script setup>
  import PageWithFormBlock from '@/templates/signup-block/page-with-form-block'
  import SocialSignupBlock from '@/templates/signup-block/social-signup-block.vue'
  import FormSignupBlock from '@/templates/signup-block/form-signup-block.vue'
  import { ref } from 'vue'

  defineProps({
    signupService: { required: true, type: Function }
  })

  const pageTitle = 'Welcome to the Edge'
  const benefitsList = [
    'No credit-card required',
    '$300 in service credits for 12 months',
    'Full access to all products and features',
    'Deploy your first Edge Application in under 5 seconds',
    'Free onboarding session'
  ]
  const formTitle = 'Create your Azion account'

  const showEmailForm = ref(false)
</script>
