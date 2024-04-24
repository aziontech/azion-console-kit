<template>
  <div>
    <section
      class="flex max-lg:flex-col justify-start px-8 surface-section py-20 overflow-y-auto gap-20 md:gap-8 md:h-visible-area"
    >
      <div
        class="w-auto flex flex-col items-center justify-start gap-16 px-20 static max-md:px-0 lg:sticky lg:top-0"
      >
        <LottieAnimation
          v-if="isAnimationDark"
          :animationData="AdditionalDataAnimationDark"
          :loop="true"
        />
        <LottieAnimation
          v-else
          :animationData="AdditionalDataAnimationLight"
          :loop="true"
        />

        <div class="w-full max-w-md flex flex-col items-center text-center gap-4">
          <h1 class="text-3xl font-medium">Personalize Your Experience</h1>
          <p class="text-xl font-normal text-color-secondary">
            Find opportunities to explore Azion and improve your projects following a unique
            journey, aligned with your needs.
          </p>
        </div>
      </div>
      <div
        class="flex flex-col justify-start items-center h-fit"
        :class="[widthClass]"
      >
        <div
          class="card w-full surface-border border rounded-md surface-section p-6 flex flex-col gap-8 xl:p-8"
        >
          <AdditionalDataFormBlock
            :listAdditionalDataInfoService="listAdditionalDataInfoService"
            :postAdditionalDataService="postAdditionalDataService"
            :patchFullnameService="patchFullnameService"
            :updateAccountInfoService="updateAccountInfoService"
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
  import { computed, ref } from 'vue'
  import { LottieAnimation } from 'lottie-web-vue'
  import { useAccountStore } from '@/stores/account'
  import { storeToRefs } from 'pinia'
  import AdditionalDataAnimationDark from '@/assets/animations/additional-data-dark.json'
  import AdditionalDataAnimationLight from '@/assets/animations/additional-data-light.json'

  const additionalDataRef = ref(null)

  const isDisabledSubmit = computed(() => {
    return !additionalDataRef.value?.meta.valid || additionalDataRef.value?.loading
  })

  const showLoading = computed(() => {
    return additionalDataRef.value?.loading ? 'pi pi-spin pi-spinner' : ''
  })

  const widthClass = computed(() => {
    return additionalDataRef.value?.hasFormValues ? 'w-auto' : 'w-full'
  })

  const { currentTheme } = storeToRefs(useAccountStore())

  const isAnimationDark = computed(() => {
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    return currentTheme.value === 'dark' || (currentTheme.value === 'system' && isSystemDark)
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
    },
    patchFullnameService: {
      type: Function,
      required: true
    },
    updateAccountInfoService: {
      type: Function,
      required: true
    }
  })
</script>
