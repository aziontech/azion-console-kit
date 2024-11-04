<script setup>
  import Illustration from '@/assets/svg/illustration-layers'
  defineOptions({ name: 'empty-results-block' })
  import PrimeButton from 'primevue/button'

  import { useRouter } from 'vue-router'

  const emit = defineEmits('click-to-create')

  const router = useRouter()

  const props = defineProps({
    title: { type: String, required: true },
    description: { type: String, required: true },
    documentationService: { type: Function, required: true },
    createPagePath: { type: String, required: false },
    disabledList: { type: Boolean, required: false },
    createButtonLabel: { type: String, required: false },
    inTabs: { type: Boolean, required: false },
    noBorder: { type: Boolean, required: false },
    noShowBorderTop: { type: Boolean, required: false, default: false }
  })
  function openDocumentation() {
    props.documentationService()
  }
  function navigateToCreatePage() {
    emit('click-to-create')
    if (props.createPagePath) {
      router.push(props.createPagePath)
    }
  }
</script>

<template>
  <div
    class="flex flex-col"
    :class="{ 'mt-4 pb-8': inTabs }"
  >
    <div
      class="flex flex-col gap-5 justify-center items-center rounded-md p-8 max-md:p-3"
      :class="{ 'border surface-border': !noBorder, 'rounded-t-none': noShowBorderTop }"
    >
      <slot name="illustration">
        <Illustration />
      </slot>
      <div class="flex flex-col gap-2 max-w-4xl">
        <p class="text-center text-color text-lg font-medium leading-7">
          {{ title }}
        </p>
        <p class="text-center text-color-secondary text-base font-normal leading-tight">
          {{ description }}
        </p>
      </div>
      <div class="flex flex-col gap-5 items-center w-full">
        <div class="flex flex-wrap gap-2 justify-center w-full">
          <slot name="extraActionsLeft"></slot>
          <slot name="default">
            <PrimeButton
              v-if="props.createButtonLabel"
              class="max-md:w-full w-fit"
              severity="secondary"
              :disabled="disabledList"
              icon="pi pi-plus"
              :data-testid="`create_${createButtonLabel}_button`"
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
