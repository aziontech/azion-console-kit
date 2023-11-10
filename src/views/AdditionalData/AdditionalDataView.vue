<template>
  <PageWithFormBlock
    :pageTitle="pageTitle"
    :benefitsList="benefitsList"
    :formTitle="formTitle"
  >
    <template #form> Form </template>
  </PageWithFormBlock>
</template>

<script setup>
  import PageWithFormBlock from '@/templates/page-with-form-block'

  const pageTitle = 'Almost there!'
  const benefitsList = [
    'Improve content delivery experience',
    'Write and deploy serverless functions',
    'Create zero-trust security architectures',
    '$300 credit to use over 12 months',
    'Free onboarding session with the Customer Success team'
  ]
  const formTitle = 'Additional Data'
</script>
