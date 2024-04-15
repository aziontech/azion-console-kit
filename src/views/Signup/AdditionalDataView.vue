<template>
  <div>
    <section
      class="flex flex-col px-3 surface-section py-20 overflow-y-auto gap-20 md:gap-8 md:flex-row md:h-visible-area"
    >
      <div
        class="flex flex-col items-center justify-start gap-16 px-20 md:w-4/5 md:sticky md:top-10"
      >
        <PrimeSkeleton class="w-full h-64" />
        <div class="w-full max-w-md flex flex-col items-center text-center gap-4">
          <h1 class="text-3xl font-medium">Personalize Your Experience</h1>
          <p class="text-xl font-normal text-color-secondary">
            Find opportunities to explore Azion and improve your projects following a unique
            journey, aligned with your needs.
          </p>
        </div>
      </div>
      <div class="w-full flex flex-col justify-start items-center my-auto">
        <div
          class="card w-full surface-border border rounded-md surface-section p-6 flex flex-col gap-8 xl:p-8"
        >
          <AdditionalDataFormBlock
            :listAdditionalDataInfoService="listAdditionalDataInfoService"
            :postAdditionalDataService="postAdditionalDataService"
            ref="additionalDataRef"
          />
        </div>
      </div>
    </section>
    <ActionBar>
      <template #default>
        <PrimeButton
          severity="primary"
          label="Submit"
          icon-pos="right"
          class="max-md:w-full"
          :icon="showLoading"
          :disabled="isDisabledSubmit"
          @click="onSubmit"
        />
      </template>
    </ActionBar>
  </div>
</template>

<script setup>
  import AdditionalDataFormBlock from '@/templates/signup-block/additional-data-form-block'
  import ActionBar from '@/templates/action-bar-block'
  import PrimeButton from 'primevue/button'
  import PrimeSkeleton from 'primevue/skeleton'
  import { computed, ref } from 'vue'

  const additionalDataRef = ref(null)

  const isDisabledSubmit = computed(() => {
    return !additionalDataRef.value?.meta.valid || additionalDataRef.value?.loading
  })

  const showLoading = computed(() => {
    return additionalDataRef.value?.loading ? 'pi pi-spin pi-spinner' : ''
  })

  const onSubmit = () => {
    additionalDataRef.value?.submitForm()
  }

  defineProps({
    listAdditionalDataInfoService: {
      type: Function,
      required: true
    },
    postAdditionalDataService: {
      type: Function,
      required: true
    }
  })
</script>
