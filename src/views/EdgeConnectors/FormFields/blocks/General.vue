<template>
  <FormHorizontal
    title="General"
    description="Create an edge connector to securely and efficiently connect your origins to Azion's Edge Network."
    data-testid="edge-connectors-form__section__general"
    :hiddenTitle="hiddenTitle"
    :noBorder="noBorder"
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name"
          required
          description="Give an unique and descriptive name to identify the edge connectors."
          name="name"
          :value="name"
          placeholder="My Edge Connector"
          data-testid="edge-connectors-form__general__name-field"
        />
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import { useField } from 'vee-validate'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'

  defineOptions({ name: 'EdgeConnectorsFormFieldsGeneral' })

  defineProps({
    hiddenTitle: {
      type: Boolean,
      default: false
    },
    noBorder: {
      type: Boolean,
      default: false
    }
  })

  const { value: name } = useField('name')
</script>
