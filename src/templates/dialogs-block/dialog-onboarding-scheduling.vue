<template>
  <PrimeDialog
    :blockScroll="true"
    modal
    visible
    :closable="false"
    :pt="{
      root: { class: 'p-0 w-[576px]' },
      header: {
        class: 'flex py-5 border-b border-solid'
      },
      content: { class: 'p-5 h-full' },
      footer: {
        class: 'flex p-5 justify-end items-end border-t border-solid'
      }
    }"
  >
    <template #header>
      <h5 class="text-lg font-semibold leading-tight">Schedule an Onboarding Session</h5>
    </template>

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
