<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="flex flex-col">
    <PageHeadingBlock :pageTitle="pageTitle" />
    <div
      class="flex flex-col h-full border border-surface gap-7 justify-center items-center rounded-md mx-8 py-7 mb-8 max-md:mx-3"
    >
      <slot name="illustration" />
      <div class="flex flex-col gap-2">
        <p class="text-center text-color text-lg font-bold leading-7">
          {{ title }}
        </p>
        <p class="text-center text-color-secondary text-sm font-normal leading-tight">
          {{ description }}
        </p>
      </div>
      <div class="flex flex-col gap-5 items-center">
        <div class="flex flex-wrap gap-2">
          <slot name="extraActionsLeft"></slot>
          <PrimeButton
            severity="secondary"
            icon="pi pi-plus"
            :label="createButtonLabel"
            @click="navigateToCreatePage"
          />
          <slot name="extraActionsRight"></slot>
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
  import { useRouter } from 'vue-router'

  const router = useRouter()

  const props = defineProps({
    pageTitle: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    createButtonLabel: { type: String, required: true },
    createPagePath: { type: String, required: true },
    documentationService: { type: Function, required: true }
  })
  function openDocumentation() {
    props.documentationService()
  }
  function navigateToCreatePage() {
    router.push(props.createPagePath)
  }
</script>
