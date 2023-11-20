<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="flex flex-col h-full">
    <PageHeadingBlock :pageTitle="pageTitle" />
    <div
      class="flex flex-col h-full border surface-border gap-7 justify-center items-center rounded-md mx-8 py-7 mb-8 max-md:mx-3"
    >
      <slot name="illustration" />
      <div class="flex flex-col gap-2">
        <p class="text-center text-color text-lg font-bold">No Edge Node list added.</p>
        <p class="text-center text-color-secondary text-sm font-normal">
          To begin the Edge Node installation process, you must download the Edge Orchestrator
          installation binary of your choice.
        </p>
      </div>
      <div class="flex flex-col gap-5 items-center">
        <div class="flex flex-wrap gap-2">
          <PrimeButton
            severity="secondary"
            outlined
            icon="pi pi-download"
            label="Edge Orchestrator"
            @click="downloadOrchestrator"
          />
        </div>
        <PrimeButton
          outlined
          text
          class="w-fit"
          icon-pos="right"
          icon="pi pi-external-link"
          label="Learn more"
          @click="openDocumentation"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
  import PageHeadingBlock from '@/templates/page-heading-block'
  import PrimeButton from 'primevue/button'

  const props = defineProps({
    pageTitle: { type: String, required: true },
    documentationService: { type: Function, required: true }
  })
  function openDocumentation() {
    props.documentationService()
  }
  function downloadOrchestrator() {
    window.open('https://downloads.azion.com/darwin/x86_64/edge-orchestrator', '_blank')
  }
</script>
