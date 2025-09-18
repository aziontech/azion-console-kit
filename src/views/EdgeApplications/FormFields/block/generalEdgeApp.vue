<template>
  <FormHorizontal
    title="General"
    :isDrawer="isDrawer"
    description="Create an Application to deliver your content from the edge."
    data-testid="form-horizontal-general"
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name"
          required
          name="name"
          placeholder="My Application"
          :value="name"
          description="Give a unique and descriptive name to identify the Application."
          data-testid="form-horizontal-general-name"
        />
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'

  import { useField } from 'vee-validate'

  defineProps({
    isDrawer: {
      type: Boolean
    }
  })

  const { value: name } = useField('name')
</script>
