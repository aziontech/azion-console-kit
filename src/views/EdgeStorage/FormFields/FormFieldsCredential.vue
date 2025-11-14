<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import Calendar from 'primevue/calendar'
  import FieldMultiSelect from '@/templates/form-fields-inputs/fieldMultiSelect'
  import LabelBlock from '@/templates/label-block'
  import { useField } from 'vee-validate'

  const capabilitiesOptions = [
    {
      label: 'List Files',
      value: 'listFiles',
      description: 'View all files stored in the bucket.'
    },
    {
      label: 'Read Files',
      value: 'readFiles',
      description: 'Access and download files from the bucket.'
    },
    {
      label: 'Write Files',
      value: 'writeFiles',
      description: 'Upload or modify files in the bucket.'
    },
    {
      label: 'Delete Files',
      value: 'deleteFiles',
      description: 'Remove files from the bucket.'
    },
    {
      label: 'List All Bucket Names',
      value: 'listAllBucketNames',
      description: 'Retrieve the names of all available buckets.'
    },
    {
      label: 'List Buckets',
      value: 'listBuckets',
      description: 'View details of buckets, including metadata and configurations.'
    }
  ]

  const { value: expirationDate, errorMessage: expirationDateError } = useField('expirationDate')

  const today = new Date()
  today.setHours(0, 0, 0, 0)
</script>

<template>
  <FormHorizontal
    title="General"
    description="Configure a new credential to securely access your Object Storage bucket."
    isDrawer
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name"
          name="name"
          placeholder="My credential"
          data-testid="credential-form__name-field"
          description="Give a unique and descriptive name to identify the credential."
          required
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Settings"
    description="Define the credential expiration date and capabilities."
    isDrawer
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-6">
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <LabelBlock
            label="Expiration Date"
            isRequired
          />
          <Calendar
            v-model="expirationDate"
            placeholder="Select date from calendar"
            data-testid="credential-form__expiration-field"
            class="w-full sm:max-w-xs"
            :showTime="false"
            dateFormat="dd/mm/yy"
            :minDate="today"
            :class="{ 'p-invalid': expirationDateError }"
            showIcon
          />
          <small
            v-if="expirationDateError"
            class="p-error"
            >{{ expirationDateError }}</small
          >
        </div>

        <div class="flex flex-col w-full gap-2">
          <FieldMultiSelect
            label="Capabilities"
            name="capabilities"
            :options="capabilitiesOptions"
            data-testid="credential-form__capabilities-field"
          />
        </div>
      </div>
    </template>
  </FormHorizontal>
</template>
