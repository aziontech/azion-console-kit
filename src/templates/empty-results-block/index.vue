<script setup>
  import Illustration from '@/assets/svg/illustration-layers'
  defineOptions({ name: 'empty-results-block' })
  import PrimeButton from 'primevue/button'

  import { useRouter } from 'vue-router'

  const router = useRouter()

  const props = defineProps({
    title: { type: String, required: true },
    description: { type: String, required: true },
    documentationService: { type: Function, required: true },
    createPagePath: { type: String, required: false },
    createButtonLabel: { type: String, required: false },
    inTabs: { type: Boolean, required: false },
    noBorder: { type: Boolean, required: false }
  })
  function openDocumentation() {
    props.documentationService()
  }
  function navigateToCreatePage() {
    router.push(props.createPagePath)
  }
</script>

<template>
  <div
    class="flex flex-col"
    :class="{ 'mt-4 pb-8': inTabs }"
  >
    <div
      class="flex flex-col p-8 gap-7 justify-center items-center rounded-md"
      :class="{ 'border surface-border': !noBorder }"
    >
      <slot name="illustration">
        <Illustration />
      </slot>
      <div class="flex flex-col gap-2">
        <p class="text-center text-color text-lg font-medium leading-7">
          {{ title }}
        </p>
        <p class="text-center text-color-secondary text-base font-normal leading-tight">
          {{ description }}
        </p>
      </div>
      <div class="flex flex-col gap-5 items-center">
        <div class="flex flex-wrap gap-2">
          <slot name="extraActionsLeft"></slot>
          <slot name="default">
            <PrimeButton
              v-if="props.createButtonLabel"
              severity="secondary"
              icon="pi pi-plus"
              :label="createButtonLabel"
              @click="navigateToCreatePage"
            />
          </slot>
          <slot name="extraActionsRight"></slot>
        </div>
        <PrimeButton
          class="w-fit"
          icon-pos="right"
          icon="pi pi-external-link"
          label="Learn more"
          link
          @click="openDocumentation"
        />
      </div>
    </div>
  </div>
</template>
