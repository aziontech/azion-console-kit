<template>
  <FormHorizontal
    title="General"
    description="Create a Connector to securely and efficiently connect your origins to Azion's Edge Network."
    data-testid="edge-connectors-form__section__general"
    :hiddenTitle="hiddenTitle"
    :noBorder="noBorder"
    :isDrawer="isDrawer"
  >
    <template #inputs>
      <FieldText
        label="Name"
        required
        description="Give an unique and descriptive name to identify the Connectors."
        name="name"
        :value="name"
        placeholder="My Connector"
        data-testid="edge-connectors-form__general__name-field"
      />
    </template>
  </FormHorizontal>
</template>

<script setup>
  import { useField } from 'vee-validate'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@aziontech/webkit/field-text'

  defineOptions({ name: 'EdgeConnectorsFormFieldsGeneral' })

  defineProps({
    hiddenTitle: {
      type: Boolean,
      default: false
    },
    noBorder: {
      type: Boolean,
      default: false
    },
    isDrawer: {
      type: Boolean,
      default: false
    }
  })

  const { value: name } = useField('name')
</script>
