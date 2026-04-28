<template>
  <div class="flex flex-col gap-6 border-l surface-border bg-surface p-6 max-w-[300px] flex-1">
    <p class="text-[13px] leading-[21px] text-color-secondary">
      <span class="font-semibold">Choose {{ planName }}</span>
      <span> to scale applications securely as an independent professional. </span>
    </p>

    <div class="flex flex-col gap-6">
      <div class="flex flex-col gap-3">
        <p class="font-protomono text-[11px] uppercase tracking-[0.08em] text-color-secondary">
          Included Features
        </p>

        <div class="flex flex-col gap-3">
          <div
            v-for="(feature, index) in planFeatures"
            :key="index"
            class="flex items-start gap-2.5"
          >
            <i
              class="pi pi-check mt-1 text-[12px]"
              :class="{ 'text-orange-500': index === 0, 'text-green-500': index !== 0 }"
            />
            <div class="flex flex-col">
              <span class="text-xs leading-5 text-default">{{ feature.title }}</span>
              <span
                v-if="feature.description"
                class="text-xs leading-5 text-color-secondary"
              >
                {{ feature.description }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-[10px]">
        <a
          href="https://www.azion.com/en/pricing/"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-1 text-xs leading-5 text-[var(--text-color-link)] hover:underline"
        >
          Learn more about Pricing
          <i class="pi pi-external-link text-[10px]" />
        </a>
        <a
          href="https://www.azion.com/en/pricing/"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-1 text-xs leading-5 text-[var(--text-color-link)] hover:underline"
        >
          Compare Plans
          <i class="pi pi-external-link text-[10px]" />
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'

  defineOptions({
    name: 'checkout-features-block'
  })

  const props = defineProps({
    plan: {
      type: String,
      required: true,
      validator: (value) => ['hobby', 'pro'].includes(value)
    }
  })

  const planInfo = {
    hobby: {
      label: 'Hobby',
      features: [
        { title: '1 Workload' },
        { title: '1M Application requests' },
        { title: '2 hours Function compute time' },
        { title: '500 MB Real-Time Events Storage' },
        { title: '5 GB Object Storage' },
        { title: '200 MB SQL Database Storage' },
        { title: '1M Firewall requests' },
        { title: 'DDoS Protection included' }
      ]
    },
    pro: {
      label: 'Pro',
      features: [
        { title: '20 Workloads' },
        { title: '20M Application requests' },
        { title: '10 hours Function compute time' },
        { title: '2 GB Real-Time Events Storage' },
        { title: '20 GB Object Storage' },
        { title: '1 GB SQL Database Storage' },
        { title: '20M Firewall requests' },
        { title: 'DDoS Protection included' }
      ]
    }
  }

  const planName = computed(() => planInfo[props.plan]?.label || props.plan)
  const planFeatures = computed(() => planInfo[props.plan]?.features || [])
</script>
