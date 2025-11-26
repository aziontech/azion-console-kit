<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown'
  import FieldMultiSelect from '@/templates/form-fields-inputs/fieldMultiSelect'
  import Calendar from 'primevue/calendar'
  import LabelBlock from '@/templates/label-block'
  import { useField } from 'vee-validate'
  import { ref, onMounted } from 'vue'
  import { edgeStorageService } from '@/services/v2/edge-storage/edge-storage-service'

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

  const bucketOptions = ref([])
  const loadingBuckets = ref(false)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const loadBuckets = async () => {
    loadingBuckets.value = true
    try {
      const response = await edgeStorageService.listEdgeStorageBuckets()
      bucketOptions.value = response.body.map((bucket) => ({
        label: bucket.name,
        value: bucket.name
      }))
    } finally {
      loadingBuckets.value = false
    }
  }

  onMounted(() => {
    loadBuckets()
  })
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
    description="Define the bucket scope, credential expiration date and capabilities."
    isDrawer
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-6">
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldDropdown
            label="Bucket"
            name="bucket"
            :options="bucketOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select a Bucket"
            data-testid="credential-form__bucket-field"
            :loading="loadingBuckets"
            required
          />
        </div>

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
            required
          />
        </div>
      </div>
    </template>
  </FormHorizontal>
</template>
