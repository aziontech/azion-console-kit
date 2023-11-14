<template>
  <PageWithFormBlock
    :pageTitle="pageTitle"
    :benefitsList="benefitsList"
    :formTitle="formTitle"
  >
    <template #form>
      <AdditionalDataFormBlock
        :listAdditionalDataInfoService="listAdditionalDataInfoService"
        :listCountriesService="listCountriesService"
      />
    </template>
  </PageWithFormBlock>
</template>

<script setup>
  import PageWithFormBlock from '@/templates/page-with-form-block'
  import AdditionalDataFormBlock from '@/templates/additional-data-form-block'

  defineProps({
    listAdditionalDataInfoService: {
      type: Function,
      required: true
    },
    listCountriesService: {
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
