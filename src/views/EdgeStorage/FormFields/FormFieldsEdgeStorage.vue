<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown'
  import { useField } from 'vee-validate'

  defineOptions({ name: 'form-fields-edge-storage' })

  const { value: name } = useField('name')
  const { value: edgeAccess } = useField('edgeAccess')

  const edgeAccessOptions = [
    { label: 'Read & Write', value: 'read_write' },
    { label: 'Read Only', value: 'read_only' },
    { label: 'Write Only', value: 'write_only' }
  ]
</script>

<template>
  <div class="flex flex-col gap-8">
    <!-- General Section -->
    <FormHorizontal
      title="General"
      description="Check the details of the Edge Storage Bucket."
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

    <!-- Settings Section -->
    <FormHorizontal
      title="Settings"
      description="Define the access level and permissions for your bucket."
    >
      <template #inputs>
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldDropdown
            label="Edge Access"
            required
            name="edgeAccess"
            :value="edgeAccess"
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
  </div>
</template>
