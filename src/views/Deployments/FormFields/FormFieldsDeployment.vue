<script setup>
  import { useField } from 'vee-validate'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@aziontech/webkit/field-text'
  import FieldTextArea from '@aziontech/webkit/field-text-area'
  import RadioButton from '@aziontech/webkit/radiobutton'
  import LabelBlock from '@aziontech/webkit/label'
  import ScopedVariablesInfoTable from '@/views/Variables/v6/components/ScopedVariablesInfoTable.vue'

  defineOptions({ name: 'form-fields-deployment' })

  const props = defineProps({
    isEdit: {
      type: Boolean,
      default: false
    },
    resourceId: {
      type: [String, Number],
      default: null
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
  } = useField('deployment_policy')

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
                name="deployment_policy"
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
    v-if="props.isEdit && props.resourceId"
    title="Variables"
    description="Variables scoped to this deployment. To create or edit them, go to the Variables page."
  >
    <template #inputs>
      <ScopedVariablesInfoTable
        scope-type="deployment"
        :scope-id="props.resourceId"
      />
    </template>
  </FormHorizontal>
</template>
