<script setup>
  import { computed, watch } from 'vue'
  import { useForm, useField } from 'vee-validate'

  import FieldSwitchBlock from '@aziontech/webkit/field-switch-block'
  import Dropdown from '@aziontech/webkit/inputs/dropdown'
  import InputText from '@aziontech/webkit/inputtext'
  import InputNumber from '@aziontech/webkit/inputnumber'

  import {
    ROLLOUT_MODE_OPTIONS,
    canaryStrategyValidationSchema,
    buildCanaryInitialValues
  } from '@/templates/release-composition/components/canary-strategy-validation'

  defineOptions({ name: 'release-canary-strategy-field' })

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

  const { value: rolloutMode } = useField('rollout_mode')
  const { value: candidatePercentage, errorMessage: percentageError } = useField(
    'gradual_rollout_candidate_percentage'
  )
  const { value: cookieName, errorMessage: cookieNameError } = useField(
    'gradual_rollout_candidate_cookie_name'
  )
  const { value: cookieMaxAge, errorMessage: cookieMaxAgeError } = useField(
    'gradual_rollout_candidate_cookie_max_age_seconds'
  )

  const canaryEnabled = computed(() => Boolean(values.gradual_rollout_enabled))

  const cookieMaxAgeHint = computed(() => {
    const seconds = Number(cookieMaxAge.value)
    if (!Number.isFinite(seconds) || seconds <= 0) {
      return 'How long the candidate cookie stays valid.'
    }
    const hours = Math.round(seconds / 3600)
    return `How long the candidate cookie stays valid — ${hours} hour(s).`
  })

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
    data-testid="release-composition__canary"
  >
    <FieldSwitchBlock
      title="Canary rollout"
      subtitle="Routes a fraction of traffic to the candidate before promoting 100%."
      nameField="gradual_rollout_enabled"
      name="release-canary-toggle"
      :isCard="false"
      :disabled="disabled"
      data-testid="release-composition__canary-toggle"
    />

    <div
      v-if="canaryEnabled"
      class="flex flex-col gap-[var(--spacing-6)] rounded-[var(--shape-elements)] border border-[var(--surface-border)] bg-[var(--surface-section)] px-[var(--spacing-5)] py-[var(--spacing-5)]"
      data-testid="release-composition__canary-fields"
    >
      <section class="flex flex-col gap-[var(--spacing-4)]">
        <span class="text-tag-sm uppercase text-[var(--text-color-secondary)]"> Traffic </span>

        <div class="grid grid-cols-1 gap-[var(--spacing-4)] sm:grid-cols-2">
          <div class="flex w-full min-w-0 flex-col gap-[var(--spacing-2)]">
            <label
              class="flex items-center gap-[var(--spacing-1)] text-body-sm font-medium text-[var(--text-color-secondary)]"
            >
              Rollout mode
            </label>
            <Dropdown
              :modelValue="rolloutMode"
              :options="ROLLOUT_MODE_OPTIONS"
              optionLabel="label"
              optionValue="value"
              placeholder="Select a rollout mode"
              :disabled="disabled"
              class="release-composition-control w-full"
              data-testid="release-composition__canary-rollout-mode"
              @update:modelValue="rolloutMode = $event"
            />
            <small class="text-body-xs text-[var(--text-color-secondary)]">
              How requests are assigned to the candidate version.
            </small>
          </div>

          <div class="flex w-full min-w-0 flex-col gap-[var(--spacing-2)]">
            <label
              class="flex items-center gap-[var(--spacing-1)] text-body-sm font-medium text-[var(--text-color-secondary)]"
            >
              Candidate percentage
            </label>
            <InputNumber
              :modelValue="candidatePercentage"
              :min="0"
              :max="100"
              showButtons
              buttonLayout="stacked"
              :disabled="disabled"
              :invalid="Boolean(percentageError)"
              class="release-composition-control w-full"
              data-testid="release-composition__canary-candidate-percentage"
              @update:modelValue="candidatePercentage = $event"
            />
            <small
              v-if="percentageError"
              class="p-error text-body-xs font-normal"
              data-testid="release-composition__canary-candidate-percentage-error"
            >
              {{ percentageError }}
            </small>
            <small
              v-else
              class="text-body-xs text-[var(--text-color-secondary)]"
            >
              Share of traffic routed to the candidate (0-100).
            </small>
          </div>
        </div>
      </section>

      <section class="flex flex-col gap-[var(--spacing-4)]">
        <span class="text-tag-sm uppercase text-[var(--text-color-secondary)]">
          Session pinning
        </span>

        <div class="grid grid-cols-1 gap-[var(--spacing-4)] sm:grid-cols-2">
          <div class="flex w-full min-w-0 flex-col gap-[var(--spacing-2)]">
            <label
              class="flex items-center gap-[var(--spacing-1)] text-body-sm font-medium text-[var(--text-color-secondary)]"
            >
              Candidate cookie name
            </label>
            <InputText
              :modelValue="cookieName"
              placeholder="azion_canary"
              :disabled="disabled"
              :invalid="Boolean(cookieNameError)"
              class="release-composition-control w-full"
              data-testid="release-composition__canary-cookie-name"
              @update:modelValue="cookieName = $event"
            />
            <small
              v-if="cookieNameError"
              class="p-error text-body-xs font-normal"
              data-testid="release-composition__canary-cookie-name-error"
            >
              {{ cookieNameError }}
            </small>
            <small
              v-else
              class="text-body-xs text-[var(--text-color-secondary)]"
            >
              Cookie that pins a client to the candidate version.
            </small>
          </div>

          <div class="flex w-full min-w-0 flex-col gap-[var(--spacing-2)]">
            <label
              class="flex items-center gap-[var(--spacing-1)] text-body-sm font-medium text-[var(--text-color-secondary)]"
            >
              Cookie max age (seconds)
            </label>
            <InputNumber
              :modelValue="cookieMaxAge"
              :min="0"
              showButtons
              buttonLayout="stacked"
              :disabled="disabled"
              :invalid="Boolean(cookieMaxAgeError)"
              class="release-composition-control w-full"
              data-testid="release-composition__canary-cookie-max-age"
              @update:modelValue="cookieMaxAge = $event"
            />
            <small
              v-if="cookieMaxAgeError"
              class="p-error text-body-xs font-normal"
              data-testid="release-composition__canary-cookie-max-age-error"
            >
              {{ cookieMaxAgeError }}
            </small>
            <small
              v-else
              class="text-body-xs text-[var(--text-color-secondary)]"
            >
              {{ cookieMaxAgeHint }}
            </small>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
  :deep(.release-composition-control),
  :deep(.release-composition-control .p-inputtext),
  :deep(.release-composition-control .p-inputnumber-input) {
    background: var(--surface-section) !important;
    border-color: var(--surface-border) !important;
  }

  :deep(.release-composition-control.p-dropdown),
  :deep(.release-composition-control.p-inputtext),
  :deep(.release-composition-control .p-inputtext),
  :deep(.release-composition-control.p-inputnumber),
  :deep(.release-composition-control .p-inputnumber-input) {
    height: 40px;
    min-height: 40px;
  }
</style>
