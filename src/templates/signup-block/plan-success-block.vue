<template>
  <div class="w-full max-w-xl mx-auto">
    <!-- Next Steps Section -->
    <div class="mt-5 bg-[var(--surface-100)] border border-[var(--surface-border)] rounded-md">
      <div
        class="p-6 flex flex-col items-center gap-[10px] border-b border-[var(--surface-border)] mb-6"
      >
        <!-- Success Icon -->
        <div class="w-8 h-8 flex items-center justify-center">
          <i class="pi pi-check text-2xl text-[var(--text-success)]" />
        </div>

        <!-- Title -->
        <h2 class="text-base font-semibold text-center text-[var(--text-color)]">
          Your {{ planDisplayName }} Plan is now Active
        </h2>

        <!-- Subtitle -->
        <p class="text-xs text-center text-[var(--text-color-secondary)] max-w-[360px]">
          A receipt has been sent to your email for your records.
        </p>
      </div>
      <p class="font-protomono text-[11px] text-[var(--text-color-secondary)] mb-5 px-6">
        Next Steps
      </p>

      <div class="flex flex-col gap-5 px-6 pb-6">
        <!-- Step 1 -->
        <div class="flex items-start gap-3">
          <div
            class="w-10 h-10 rounded-lg bg-[rgba(128,128,128,0.12)] flex items-center justify-center shrink-0"
          >
            <span class="font-protomono font-semibold text-xs text-white">1</span>
          </div>
          <div class="flex flex-col gap-1">
            <p class="text-[13px] font-semibold text-[var(--text-color)]">
              Start by creating your first Deploy
            </p>
            <p class="text-xs text-[var(--text-color-secondary)]">
              Deploy your application and start delivering content through the Azion Network.
            </p>
          </div>
        </div>

        <!-- Step 2 -->
        <div class="flex items-start gap-3">
          <div
            class="w-10 h-10 rounded-lg bg-[rgba(128,128,128,0.12)] flex items-center justify-center shrink-0"
          >
            <span class="font-protomono font-semibold text-xs text-white">2</span>
          </div>
          <div class="flex flex-col gap-1">
            <p class="text-[13px] font-semibold text-[var(--text-color)]">
              Protect your Application
            </p>
            <p class="text-xs text-[var(--text-color-secondary)]">
              Enable security features to safeguard your applications, users, and data.
            </p>
          </div>
        </div>

        <!-- Step 3 -->
        <div class="flex items-start gap-3">
          <div
            class="w-10 h-10 rounded-lg bg-[rgba(128,128,128,0.12)] flex items-center justify-center shrink-0"
          >
            <span class="font-protomono font-semibold text-xs text-white">3</span>
          </div>
          <div class="flex flex-col gap-1">
            <p class="text-[13px] font-semibold text-[var(--text-color)]">Observe your Metrics</p>
            <p class="text-xs text-[var(--text-color-secondary)]">
              Track metrics, analyze traffic in real-time, and gain insights to optimize and protect
              your applications.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- CTA Button -->
    <div class="mt-5">
      <Button
        severity="primary"
        class="w-full font-protomono flex items-center justify-center"
        @click="handleStartClick"
      >
        Start deploying
      </Button>
    </div>
  </div>
</template>

<script setup>
  import { computed, onMounted, inject } from 'vue'
  import Button from '@aziontech/webkit/button'

  /** @type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  defineOptions({
    name: 'plan-success-block'
  })

  const props = defineProps({
    plan: {
      type: String,
      required: true,
      validator: (value) => ['hobby', 'pro'].includes(value)
    }
  })

  const emit = defineEmits(['onStart'])

  const planDisplayName = computed(() => {
    const planNames = {
      hobby: 'Hobby',
      pro: 'Pro'
    }
    return planNames[props.plan] || props.plan
  })

  onMounted(() => {
    tracker.signUp.successScreenViewed({ plan: props.plan }).track()
  })

  const handleStartClick = () => {
    tracker.signUp.startDeployingClicked({ plan: props.plan }).track()
    emit('onStart')
  }
</script>
