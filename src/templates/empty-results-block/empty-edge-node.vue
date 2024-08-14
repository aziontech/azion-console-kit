<template>
  <div class="flex flex-col h-full">
    <div
      class="flex flex-col h-full border surface-border gap-7 justify-center items-center rounded-md"
    >
      <slot name="illustration">
        <Illustration />
      </slot>
      <div class="flex flex-col gap-2">
        <p class="text-center text-color text-lg font-bold">No edge nodes have been added</p>
        <p class="text-center text-color-secondary text-sm font-normal">
          To begin the Edge Node installation process, download the appropriate Edge Orchestrator
          installation binary.
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
  defineOptions({ name: 'empty-results-block' })
  import PrimeButton from 'primevue/button'
  import Illustration from '@/assets/svg/illustration-layers'

  const props = defineProps({
    pageTitle: { type: String, required: true },
    documentationService: { type: Function, required: true }
  })
  function openDocumentation() {
    props.documentationService()
  }
  function downloadOrchestrator() {
    window.open(
      'https://www.azion.com/en/documentation/products/guides/deploy/install-orchestrator-agent/',
      '_blank'
    )
  }
</script>
