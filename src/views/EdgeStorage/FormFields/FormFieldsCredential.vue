<template>
  <div class="flex flex-col gap-6">
    <FormHorizontal
      title="General"
      description="Give a unique and descriptive name to identify this credential."
      isDrawer
    >
      <template #inputs>
        <FieldText
          label="Name"
          name="name"
          required
          placeholder="My Credential"
          class="w-full max-w-md"
          v-model="name"
        />
      </template>
    </FormHorizontal>

    <FormHorizontal
      title="Settings"
      description="Define the credential expiration date by selecting one of the suggested date ranges. For security matters, the access key and secret key token will only be available right after it's created."
      isDrawer
    >
      <template #inputs>
        <Calendar
          placeholder="Select expiration date"
          name="expirationDate"
          dateFormat="dd/mm/yy"
          showIcon
          class="w-full max-w-md"
          v-model="expirationDate"
        />
      </template>
    </FormHorizontal>
  </div>
</template>

<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal.vue'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import Calendar from 'primevue/calendar'
  import { useField } from 'vee-validate'

  const { value: name } = useField('name')
  const { value: expirationDate } = useField('expirationDate')
</script>
