<template>
  <PrimeDialog
    :blockScroll="true"
    modal
    class="max-w-xl"
    visible
    :closable="false"
    header="Schedule an Onboarding Session"
  >
    <div class="flex flex-col">
      <p class="text-color-secondary text-sm font-normal leading-tight">
        Ready to dive in? Book an onboarding session with an Azion expert for personalized guidance
        and support.
      </p>
    </div>

    <template #footer>
      <PrimeButton
        outlined
        @click="closeCallback"
        label="Remind Later"
      />
      <PrimeButton
        severity="secondary"
        @click="openOnboarding"
        icon="pi pi-calendar-plus"
        label="Schedule Now"
      />
    </template>
  </PrimeDialog>
</template>
<script setup>
  import PrimeDialog from 'primevue/dialog'
  import PrimeButton from 'primevue/button'
  import { inject } from 'vue'
  import { useRouter } from 'vue-router'
  import { azionOnboardingWindowOpener } from '@/helpers'
  const dialogRef = inject('dialogRef')
  const router = useRouter()

  const closeCallback = () => {
    router.push({
      params: {}
    })
    dialogRef.value.close()
  }

  const openOnboarding = () => {
    azionOnboardingWindowOpener()
    closeCallback()
  }
</script>
