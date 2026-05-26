<template>
  <div
    class="flex flex-col gap-6 p-6 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-card)] flex-1"
    :class="{ 'ring-2 ring-orange-500': highlighted }"
  >
    <header class="flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <h3 class="text-2xl font-semibold text-color">{{ name }}</h3>
        <span
          v-if="chipLabel"
          class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold"
          :class="chipClass"
        >
          {{ chipLabel }}
        </span>
      </div>
      <p
        v-if="tagline"
        class="text-sm text-color-secondary"
      >
        {{ tagline }}
      </p>
    </header>

    <div class="flex flex-col gap-1">
      <div class="flex items-baseline gap-2">
        <span class="text-3xl font-semibold text-color">{{ price }}</span>
        <span
          v-if="priceUnit"
          class="text-sm text-color-secondary"
          >{{ priceUnit }}</span
        >
      </div>
      <p
        v-if="billingLine"
        class="text-xs text-color-secondary"
      >
        {{ billingLine }}
      </p>
    </div>

    <div class="flex flex-col gap-3">
      <p
        v-if="sectionTitle"
        class="text-xs text-color-secondary"
      >
        {{ sectionTitle }}
      </p>
      <ul class="flex flex-col gap-2">
        <li
          v-for="feature in features"
          :key="feature.title"
          class="flex items-center gap-2 text-sm text-color"
        >
          <i
            v-if="feature.icon"
            :class="[feature.icon, 'text-color-secondary text-sm']"
          />
          <span>{{ feature.title }}</span>
        </li>
      </ul>
    </div>

    <PrimeButton
      :label="buttonLabel"
      :severity="buttonSeverity"
      :outlined="buttonOutlined"
      :disabled="buttonDisabled"
      class="w-full mt-auto"
      @click="$emit('action')"
    />
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import PrimeButton from '@aziontech/webkit/button'

  defineOptions({ name: 'plan-comparison-card' })

  const props = defineProps({
    name: { type: String, required: true },
    chipLabel: { type: String, default: '' },
    chipVariant: { type: String, default: 'recommended' },
    tagline: { type: String, default: '' },
    price: { type: String, default: '' },
    priceUnit: { type: String, default: '' },
    billingLine: { type: String, default: '' },
    sectionTitle: { type: String, default: '' },
    features: { type: Array, default: () => [] },
    buttonLabel: { type: String, required: true },
    buttonSeverity: { type: String, default: 'primary' },
    buttonOutlined: { type: Boolean, default: false },
    buttonDisabled: { type: Boolean, default: false },
    highlighted: { type: Boolean, default: false }
  })

  defineEmits(['action'])

  const chipClass = computed(() => {
    if (props.chipVariant === 'current') {
      return 'bg-orange-500/15 text-orange-500 border border-orange-500/30'
    }
    return 'bg-orange-500/15 text-orange-500 border border-orange-500/30'
  })
</script>
