<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import { useField } from 'vee-validate'

  const { value: name } = useField('name')

  const props = defineProps({
    isDrawer: {
      type: Boolean,
      required: true
    },
    noBorder: {
      type: Boolean,
      required: true
    }
  })
</script>
<template>
  <form-horizontal
    :isDrawer="props.isDrawer"
    :noBorder="props.noBorder"
    title="General"
    description="Create a workload with Azion to launch an edge application and set up security with digital certificates."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name"
          required
          name="name"
          placeholder="My workload"
          :value="name"
          description="This is an identification name for the workload. Once you save the configuration, the URL will be automatically generated."
        />
      </div>
    </template>
  </form-horizontal>
</template>
