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
        :listSocialIdpsService="listSocialIdpsService"
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
    signupService: { required: true, type: Function },
    listSocialIdpsService: { required: true, type: Function }
  })

  const pageTitle = 'Welcome to the Edge'
  const benefitsList = [
    'No credit card is required',
    '$300 credit to use over 12 months',
    'Full access to all products and features',
    'Deploy an edge application in a few clicks',
    'Free onboarding session'
  ]
  const formTitle = 'Create your Azion Account'

  const showEmailForm = ref(false)
</script>
