<template>
  <FormHorizontal
    title="General"
    :isDrawer="isDrawer"
    description="Create an Application to deliver your content from the edge."
    data-testid="form-horizontal-general"
  >
    <template #inputs>
      <FieldText
        label="Name"
        required
        name="name"
        placeholder="My Application"
        :value="name"
        :disabled="readOnly"
        description="Give a unique and descriptive name to identify the Application."
        data-testid="form-horizontal-general-name"
      />
    </template>
  </FormHorizontal>
</template>

<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@aziontech/webkit/field-text'

  import { useField } from 'vee-validate'
  import { useVersionContext } from '@/composables/versioning/use-version-context'

  defineProps({
    isDrawer: {
      type: Boolean
    }
  })

  const { value: name } = useField('name')
  const { readOnly } = useVersionContext()
</script>
