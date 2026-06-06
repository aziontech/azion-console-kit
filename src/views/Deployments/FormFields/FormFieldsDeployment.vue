<script setup>
  import { useField } from 'vee-validate'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@aziontech/webkit/field-text'
  import FieldTextArea from '@aziontech/webkit/field-text-area'
  import FieldSwitchBlock from '@aziontech/webkit/field-switch-block'
  import FieldNumber from '@aziontech/webkit/field-number'
  import RadioButton from '@aziontech/webkit/radiobutton'
  import LabelBlock from '@aziontech/webkit/label'

  defineOptions({ name: 'form-fields-deployment' })

  const props = defineProps({
    isEdit: {
      type: Boolean,
      default: false
    }
  })

  const { value: name } = useField('name')
  const { value: description } = useField('description')
  const {
    value: bindingPolicy,
    setValue: setBindingPolicy,
    errorMessage: bindingPolicyError
  } = useField('binding_policy')
  const {
    value: deploymentVersionPolicy,
    setValue: setDeploymentVersionPolicy,
    errorMessage: deploymentVersionPolicyError
  } = useField('deployment_version_policy')
  const { value: strategyCanaryEnabled } = useField('strategy_canary_enabled')
  const { value: strategyCanaryDefaultPercentage } = useField('strategy_canary_default_percentage')
  const { value: strategySkewEnabled } = useField('strategy_skew_enabled')
  const { value: strategySkewDefaultTtlSeconds } = useField('strategy_skew_default_ttl_seconds')

  const bindingPolicyOptions = [
    {
      title: 'Strict',
      subtitle: 'Lock resource ids per version. Promotes are strict-mode replicas.',
      value: 'STRICT'
    },
    {
      title: 'Flexible',
      subtitle: 'Allow swapping resource ids across versions.',
      value: 'FLEXIBLE'
    }
  ]

  const deploymentVersionPolicyOptions = [
    {
      title: 'Single Version',
      subtitle: 'Keep one active version routing all traffic.',
      value: 'single_version'
    },
    {
      title: 'Versioned URLs',
      subtitle: 'Allow multiple reachable versions via versioned URLs.',
      value: 'versioned_urls'
    }
  ]
</script>

<template>
  <FormHorizontal
    title="General"
    description="Identify this deployment stream."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name"
          name="name"
          required
          placeholder="magalu-storefront"
          description="Use a clear name to identify this deployment."
          :value="name"
          data-testid="deployment-form__name-field"
        />

        <FieldTextArea
          label="Description"
          name="description"
          placeholder="Logical deploy channel"
          description="Optional description used for internal identification."
          :value="description"
          data-testid="deployment-form__description-field"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Routing & Policy"
    description="Define how versions bind to resources and how routing is organized."
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-6">
        <div class="flex flex-col gap-2">
          <LabelBlock
            label="Binding Policy"
            isRequired
            data-testid="deployment-form__binding-policy-label"
          />
          <div class="flex flex-col gap-3">
            <div
              v-for="option in bindingPolicyOptions"
              :key="option.value"
              class="flex items-start gap-3"
            >
              <RadioButton
                :inputId="`binding-policy-${option.value}`"
                name="binding_policy"
                :value="option.value"
                :modelValue="bindingPolicy"
                @update:modelValue="setBindingPolicy"
                :data-testid="`deployment-form__binding-policy-${option.value}`"
              />
              <label
                :for="`binding-policy-${option.value}`"
                class="flex flex-col gap-1 cursor-pointer"
              >
                <span class="text-sm text-color">{{ option.title }}</span>
                <span class="text-xs text-color-secondary leading-tight">
                  {{ option.subtitle }}
                </span>
              </label>
            </div>
          </div>
          <small class="text-xs text-color-secondary font-normal leading-5">
            Strict deployments lock resource ids; Flexible deployments allow swapping.
          </small>
          <small
            v-if="bindingPolicyError"
            class="p-error text-xs font-normal leading-tight"
          >
            {{ bindingPolicyError }}
          </small>
        </div>

        <div class="flex flex-col gap-2">
          <LabelBlock
            label="Deployment Version Policy"
            isRequired
            data-testid="deployment-form__version-policy-label"
          />
          <div class="flex flex-col gap-3">
            <div
              v-for="option in deploymentVersionPolicyOptions"
              :key="option.value"
              class="flex items-start gap-3"
              :class="{ 'opacity-60': props.isEdit }"
            >
              <RadioButton
                :inputId="`deployment-version-policy-${option.value}`"
                name="deployment_version_policy"
                :value="option.value"
                :modelValue="deploymentVersionPolicy"
                :disabled="props.isEdit"
                @update:modelValue="setDeploymentVersionPolicy"
                :data-testid="`deployment-form__version-policy-${option.value}`"
              />
              <label
                :for="`deployment-version-policy-${option.value}`"
                class="flex flex-col gap-1"
                :class="props.isEdit ? 'cursor-not-allowed' : 'cursor-pointer'"
              >
                <span class="text-sm text-color">{{ option.title }}</span>
                <span class="text-xs text-color-secondary leading-tight">
                  {{ option.subtitle }}
                </span>
              </label>
            </div>
          </div>
          <small class="text-xs text-color-secondary font-normal leading-5">
            Single Version keeps one active version; Versioned URLs allow multiple reachable
            versions. Immutable after creation.
          </small>
          <small
            v-if="props.isEdit"
            class="text-xs text-color-secondary font-normal leading-5"
          >
            Deployment Version Policy cannot be changed after the deployment is created.
          </small>
          <small
            v-if="deploymentVersionPolicyError"
            class="p-error text-xs font-normal leading-tight"
          >
            {{ deploymentVersionPolicyError }}
          </small>
        </div>
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Strategy Defaults"
    description="Default rollout behavior applied to new versions of this deployment."
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-6">
        <div class="flex flex-col w-full gap-3">
          <FieldSwitchBlock
            nameField="strategy_canary_enabled"
            name="strategy_canary_enabled"
            :value="strategyCanaryEnabled"
            auto
            :isCard="false"
            title="Canary"
            description="Enable gradual rollout to a percentage of traffic before promoting the new version."
            data-testid="deployment-form__canary-enabled-field"
          />

          <div
            v-if="strategyCanaryEnabled"
            class="flex flex-col sm:max-w-xs w-full gap-2"
          >
            <FieldNumber
              label="Canary Default Percentage"
              name="strategy_canary_default_percentage"
              :min="0"
              :max="100"
              :value="strategyCanaryDefaultPercentage"
              description="Percentage of traffic routed to the candidate version (0-100)."
              placeholder="10"
              :useGrouping="false"
              suffix="%"
              data-testid="deployment-form__canary-percentage-field"
            />
          </div>
        </div>

        <div class="flex flex-col w-full gap-3">
          <FieldSwitchBlock
            nameField="strategy_skew_enabled"
            name="strategy_skew_enabled"
            :value="strategySkewEnabled"
            auto
            :isCard="false"
            title="Skew Protection"
            description="Keep the previous version reachable via versioned URL after a new version is promoted."
            data-testid="deployment-form__skew-enabled-field"
          />

          <div
            v-if="strategySkewEnabled"
            class="flex flex-col sm:max-w-xs w-full gap-2"
          >
            <FieldNumber
              label="Skew Protection TTL"
              name="strategy_skew_default_ttl_seconds"
              :min="0"
              :value="strategySkewDefaultTtlSeconds"
              description="How long the previous version stays reachable, in seconds."
              placeholder="3600"
              :useGrouping="false"
              suffix=" s"
              data-testid="deployment-form__skew-ttl-field"
            />
          </div>
        </div>
      </div>
    </template>
  </FormHorizontal>
</template>
