<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown'
  import PrimeButton from 'primevue/button'
  import { useField } from 'vee-validate'

  defineOptions({ name: 'form-fields-edge-storage' })
  defineProps({
    showDangerZone: {
      type: Boolean,
      default: true
    },
    disableNameEdit: {
      type: Boolean,
      default: false
    }
  })

  defineEmits(['delete-bucket'])

  const { value: name } = useField('name')
  const { value: edge_access } = useField('edge_access')

  const edgeAccessOptions = [
    { label: 'Read & Write', value: 'read_write' },
    { label: 'Read Only', value: 'read_only' },
    { label: 'Restricted', value: 'restricted' }
  ]
</script>

<template>
  <div class="flex flex-col gap-8">
    <FormHorizontal
      title="General"
      description="Check the details of the Edge Storage Bucket."
      :disabled="disableNameEdit"
    >
      <template #inputs>
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Name"
            required
            name="name"
            placeholder="Sample Bucket"
            :value="name"
            description="Give a unique and descriptive name to identify this bucket."
            data-testid="edge-storage-form__name-field"
          />
        </div>
      </template>
    </FormHorizontal>
    <FormHorizontal
      title="Settings"
      description="Define the access level and permissions for your bucket."
    >
      <template #inputs>
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldDropdown
            label="Edge Access"
            required
            name="edge_access"
            :value="edge_access"
            :options="edgeAccessOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select a Edge Access level."
            description="Select the appropriate access level for your bucket based on your application's requirements."
            data-testid="edge-storage-form__edge-access-field"
          />
        </div>
      </template>
    </FormHorizontal>

    <FormHorizontal
      v-if="showDangerZone"
      title="Danger Zone"
      severity="danger"
      description="Actions in this area are irreversible and may permanently impact the account and its data. Proceed with caution."
    >
      <template #inputs>
        <div class="flex flex-col w-full gap-5 sm:max-w-lg">
          <div class="flex flex-col gap-2">
            <label class="text-color text-base font-medium leading-5 flex gap-1 align-items-center">
              Delete Bucket
            </label>
            <small class="text-sm text-color-secondary font-normal leading-5">
              This action permanently deletes this Bucket and all associated data from Azion's
              platform. It cannot be undone.
            </small>
          </div>
          <div>
            <PrimeButton
              data-testid="account-settings__delete-account"
              label="Delete Bucket"
              severity="danger"
              @click="$emit('delete-bucket')"
            />
          </div>
        </div>
      </template>
    </FormHorizontal>
  </div>
</template>
