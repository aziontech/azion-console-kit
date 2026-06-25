<script setup>
  import { computed, watch } from 'vue'
  import { useForm } from 'vee-validate'

  import FieldSwitchBlock from '@aziontech/webkit/field-switch-block'
  import FieldNumber from '@aziontech/webkit/field-number'
  import FieldText from '@aziontech/webkit/field-text'
  import FieldDropdown from '@aziontech/webkit/field-dropdown'

  import {
    ROLLOUT_MODE_OPTIONS,
    canaryStrategyValidationSchema,
    buildCanaryInitialValues
  } from '@/templates/deploy-drawer-block/components/canary-strategy-validation'

  defineOptions({ name: 'deploy-drawer-canary-strategy-field' })

  defineProps({
    disabled: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['update:enabled', 'update:form'])

  const { values } = useForm({
    validationSchema: canaryStrategyValidationSchema,
    initialValues: buildCanaryInitialValues()
  })

  const canaryEnabled = computed(() => Boolean(values.gradual_rollout_enabled))

  watch(
    () => values.gradual_rollout_enabled,
    (enabled) => emit('update:enabled', Boolean(enabled)),
    { immediate: true }
  )

  watch(values, (current) => emit('update:form', { ...current }), { deep: true, immediate: true })
</script>

<template>
  <div
    class="flex flex-col gap-[var(--spacing-4)]"
    data-testid="deploy-drawer__canary"
  >
    <FieldSwitchBlock
      title="Canary rollout"
      subtitle="Routes a fraction of traffic to the candidate before promoting 100%."
      nameField="gradual_rollout_enabled"
      name="deploy-drawer-canary-toggle"
      :isCard="false"
      :disabled="disabled"
      data-testid="deploy-drawer__canary-toggle"
    />

    <div
      v-if="canaryEnabled"
      class="flex flex-col gap-[var(--spacing-4)] rounded-[var(--shape-elements)] border border-[var(--surface-border)] bg-[var(--surface-section)] px-[var(--spacing-4)] py-[var(--spacing-4)]"
      data-testid="deploy-drawer__canary-fields"
    >
      <FieldDropdown
        label="Rollout mode"
        name="rollout_mode"
        :options="ROLLOUT_MODE_OPTIONS"
        optionLabel="label"
        optionValue="value"
        placeholder="Select a rollout mode"
        :disabled="disabled"
        data-testid="deploy-drawer__canary-rollout-mode"
      />

      <FieldNumber
        label="Candidate percentage"
        name="gradual_rollout_candidate_percentage"
        description="Share of traffic routed to the candidate version (0-100)."
        :min="0"
        :max="100"
        :disabled="disabled"
        data-testid="deploy-drawer__canary-candidate-percentage"
      />

      <FieldText
        label="Candidate cookie name"
        name="gradual_rollout_candidate_cookie_name"
        placeholder="e.g. azion_canary"
        description="Cookie that pins a client to the candidate version."
        :disabled="disabled"
        data-testid="deploy-drawer__canary-cookie-name"
      />

      <FieldNumber
        label="Candidate cookie max age (seconds)"
        name="gradual_rollout_candidate_cookie_max_age_seconds"
        description="How long the candidate cookie stays valid."
        :min="0"
        :disabled="disabled"
        data-testid="deploy-drawer__canary-cookie-max-age"
      />
    </div>
  </div>
</template>
