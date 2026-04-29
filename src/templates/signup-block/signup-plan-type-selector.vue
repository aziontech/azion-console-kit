<template>
  <div class="flex flex-col gap-2">
    <label class="text-xs leading-4 text-color-secondary">Choose plan</label>

    <div class="border surface-border rounded-md overflow-hidden bg-surface">
      <label
        v-for="(option, index) in planOptions"
        :key="option.value"
        :for="`signup-plan-${option.value}`"
        class="flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors hover:bg-[var(--surface-hover)]"
        :class="{
          'border-t surface-border': index > 0,
          'surface-section': selectedPlan === option.value
        }"
      >
        <RadioButton
          v-model="selectedPlan"
          :inputId="`signup-plan-${option.value}`"
          class="signup-plan-radio"
          name="signup-plan-type"
          :value="option.value"
        />

        <span class="flex-1 text-sm leading-5 text-color">
          {{ option.description }}
        </span>

        <span
          class="rounded-full px-2 py-0.5 text-xs leading-4 font-medium"
          :class="option.badgeClass"
        >
          {{ option.label }}
        </span>
      </label>
    </div>
  </div>
</template>

<script setup>
  import { computed, onMounted } from 'vue'
  import RadioButton from '@aziontech/webkit/radiobutton'
  import { usePlans } from '@/composables/usePlans'

  defineOptions({
    name: 'signup-plan-type-selector'
  })

  const planOptions = [
    {
      value: 'pro',
      label: 'Pro',
      description: "I'm ready to deploy applications with predictable costs",
      badgeClass: 'bg-primary text-white'
    },
    {
      value: 'hobby',
      label: 'Hobby',
      description: "I'm exploring Azion for personal projects and learning",
      badgeClass: 'bg-[var(--surface-500)] text-white'
    }
  ]

  const validSignupPlans = planOptions.map((option) => option.value)
  const { plan, initialize, setParam } = usePlans()

  const selectedPlan = computed({
    get: () => (validSignupPlans.includes(plan.value) ? plan.value : 'hobby'),
    set: (value) => {
      if (validSignupPlans.includes(value)) {
        setParam('plan', value)
      }
    }
  })

  onMounted(() => {
    initialize()

    if (!validSignupPlans.includes(plan.value)) {
      setParam('plan', 'hobby')
    }
  })
</script>

<style scoped>
  .signup-plan-radio :deep(.p-radiobutton-box) {
    width: 14px;
    height: 14px;
  }

  .signup-plan-radio :deep(.p-radiobutton-icon) {
    width: 6px;
    height: 6px;
  }
</style>
