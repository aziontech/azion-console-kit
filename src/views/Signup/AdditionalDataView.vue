<template>
  <div>
    <section class="flex gap-8 px-3 surface-section h-visible-area py-20 overflow-y-auto">
      <div class="w-4/5 flex flex-col items-center justify-center gap-16 sticky top-20 px-20">
        <div class="w-full h-64 bg-slate-500/25" />
        <div class="w-full flex flex-col items-center text-center gap-4">
          <h1 class="text-3xl font-medium">Personalize Your Experience</h1>
          <p class="text-xl font-normal text-color-secondary">
            Find opportunities to explore Azion and improve your projects following a unique
            journey, aligned with your needs.
          </p>
        </div>
      </div>
      <div class="w-full flex justify-start items-center min-h-visible-area my-auto">
        <div
          class="card w-full surface-border border rounded-md surface-section p-6 xl:p-8 flex flex-col gap-8"
        >
          <AdditionalDataFormBlock
            :listAdditionalDataInfoService="listAdditionalDataInfoService"
            :listCountriesService="listCountriesService"
            :putAdditionalDataService="putAdditionalDataService"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
  import AdditionalDataFormBlock from '@/templates/signup-block/additional-data-form-block'

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
</script>
