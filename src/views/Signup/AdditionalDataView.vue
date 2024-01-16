<template>
  <PageWithFormBlock
    :pageTitle="pageTitle"
    :benefitsList="benefitsList"
    :formTitle="formTitle"
    :showSignupBtn="false"
  >
    <template #form>
      <AdditionalDataFormBlock
        :listAdditionalDataInfoService="listAdditionalDataInfoService"
        :listCountriesService="listCountriesService"
        :putAdditionalDataService="putAdditionalDataService"
      />
    </template>
  </PageWithFormBlock>
</template>

<script setup>
  import AdditionalDataFormBlock from '@/templates/signup-block/additional-data-form-block'
  import PageWithFormBlock from '@/templates/signup-block/page-with-form-block'

  defineProps({
    listAdditionalDataInfoService: {
      type: Function,
      required: true
    },
    listCountriesService: {
      type: Function,
      required: true
    },
    putAdditionalDataService: {
      type: Function,
      required: true
    }
  })

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
