<template>
  <div class="flex flex-col min-h-screen var(--bg-color)">
    <!-- Main Content -->
    <div class="flex-1 flex flex-col items-center justify-center py-8 px-4 gap-6">
      <!-- Card Container -->
      <div class="w-full max-w-xl">
        <CardBox title="How are you planning to use Azion?">
          <template #content>
            <div class="p-6 overflow-visible">
              <AdditionalDataFormBlock
                :postAdditionalDataService="postAdditionalDataService"
                :patchFullnameService="patchFullnameService"
                :updateAccountInfoService="updateAccountInfoService"
                ref="additionalDataRef"
              />
            </div>
          </template>

          <template #footer>
            <PrimeButton
              severity="primary"
              class="w-full font-protomono flex items-center justify-center"
              :icon="showLoading"
              :disabled="isDisabledSubmit"
              @click="onSubmit"
            >
              <Transition
                name="label-fade"
                mode="out-in"
              >
                <span :key="submitButtonLabel">{{ submitButtonLabel }}</span>
              </Transition>
            </PrimeButton>
          </template>
        </CardBox>
      </div>

      <!-- Enterprise Link -->
      <div
        class="bg-[var(--surface-100)] border border-[var(--surface-border)] border-solid rounded-md px-3 py-3 w-full max-w-xl text-center"
      >
        <span class="text-xs text-[var(--text-color-secondary)]"
          >Have enterprise requirements?
        </span>
        <a
          href="https://www.azion.com/en/contact/"
          target="_blank"
          class="text-xs text-[var(--text-color-link)] hover:underline"
        >
          Get in touch
        </a>
        <span class="text-xs text-[var(--text-color-secondary)]"> with our team.</span>
      </div>

      <!-- Compare Plans Link -->
      <div>
        <a
          href="https://www.azion.com/en/pricing/"
          target="_blank"
          class="text-xs text-[var(--text-color-link)] hover:underline flex items-center gap-1"
        >
          Compare Plans
          <i class="pi pi-arrow-right text-[10px]" />
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
  import CardBox from '@aziontech/webkit/card-box'
  import AdditionalDataFormBlock from '@/templates/signup-block/additional-data-form-block.vue'
  import PrimeButton from 'primevue/button'
  import { computed, ref } from 'vue'

  const additionalDataRef = ref(null)

  const isDisabledSubmit = computed(() => {
    return !additionalDataRef.value?.meta.valid || additionalDataRef.value?.loading
  })

  const showLoading = computed(() => {
    return additionalDataRef.value?.loading ? 'pi pi-spin pi-spinner' : ''
  })

  const submitButtonLabel = computed(() => {
    const plan = additionalDataRef.value?.plan
    if (plan === 'hobby') return 'Start Deploying'
    return 'Continue'
  })

  const onSubmit = () => {
    additionalDataRef.value?.submitForm()
  }

  defineProps({
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

<style scoped>
  .label-fade-enter-active,
  .label-fade-leave-active {
    transition: opacity 150ms ease;
  }

  .label-fade-enter-from,
  .label-fade-leave-to {
    opacity: 0;
  }
</style>
