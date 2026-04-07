<script setup>
  import { useRouter } from 'vue-router'
  import Illustration403 from '@aziontech/webkit/svg/error-403'
  import Illustration404 from '@aziontech/webkit/svg/error-404'
  import PrimeButton from '@aziontech/webkit/button'
  import ErrorPageBlock from '@/templates/error-page-block'

  const props = defineProps({
    statusCode: {
      type: Number,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    buttons: {
      type: Object,
      default: () => ({
        backToHome: 'Back to Home',
        documentation: 'Documentation'
      })
    },
    documentationService: {
      type: Function,
      required: true
    }
  })

  const illustration = {
    403: Illustration403,
    404: Illustration404
  }

  const IllustrationComponent = illustration[props.statusCode]

  const router = useRouter()

  function handleGoBackHome() {
    router.push('/')
  }
</script>

<template>
  <ErrorPageBlock
    :title="props.title"
    :description="props.description"
  >
    <template #illustration>
      <IllustrationComponent />
    </template>

    <template #actions>
      <PrimeButton
        :label="props.buttons.backToHome"
        @click="handleGoBackHome"
      />
      <PrimeButton
        outlined
        :label="props.buttons.documentation"
        @click="props.documentationService"
      />
    </template>
  </ErrorPageBlock>
</template>
