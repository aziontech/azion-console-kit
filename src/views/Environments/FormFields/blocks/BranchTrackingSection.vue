<script setup>
  import { useField } from 'vee-validate'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldSwitchBlock from '@aziontech/webkit/field-switch-block'
  import FieldDropdown from '@aziontech/webkit/field-dropdown'
  import FieldText from '@aziontech/webkit/field-text'

  defineOptions({ name: 'environment-form-branch-tracking-section' })

  const props = defineProps({
    disabledFields: {
      type: Boolean,
      default: false
    }
  })

  const { value: branchTrackingEnabled } = useField('branch_tracking.enabled')
  const { value: branchTrackingMode } = useField('branch_tracking.mode')
  const { value: branchTrackingMatch } = useField('branch_tracking.branch_match')

  const modeOptions = [
    { label: 'Branch is', value: 'branch_is' },
    { label: 'Branch starts with', value: 'branch_starts_with' },
    { label: 'Branch ends with', value: 'branch_ends_with' }
  ]
</script>

<template>
  <FormHorizontal
    title="Branch Tracking"
    description="Automatically build this environment when a matching Git branch is updated."
    data-testid="environment-form__section__branch-tracking"
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-4">
        <FieldSwitchBlock
          nameField="branch_tracking.enabled"
          name="branch_tracking.enabled"
          auto
          :isCard="false"
          :value="branchTrackingEnabled"
          :disabled="props.disabledFields"
          title="Enable branch tracking"
          subtitle="Track a Git branch pattern to trigger builds."
          data-testid="environment-form__branch-tracking__enabled-field"
        />

        <div
          v-if="branchTrackingEnabled"
          class="flex flex-col sm:max-w-lg w-full gap-4"
        >
          <FieldDropdown
            label="Mode"
            name="branch_tracking.mode"
            required
            :options="modeOptions"
            :value="branchTrackingMode"
            optionLabel="label"
            optionValue="value"
            appendTo="self"
            description="How the branch name is matched."
            :disabled="props.disabledFields"
            data-testid="environment-form__branch-tracking__mode-field"
          />

          <FieldText
            label="Branch Match"
            name="branch_tracking.branch_match"
            required
            placeholder="release/"
            description="The branch name or pattern to match."
            :value="branchTrackingMatch"
            :disabled="props.disabledFields"
            data-testid="environment-form__branch-tracking__match-field"
          />
        </div>
      </div>
    </template>
  </FormHorizontal>
</template>
