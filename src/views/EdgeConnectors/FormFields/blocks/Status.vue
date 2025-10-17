<template>
  <FormHorizontal
    title="Status"
    data-testid="edge-connectors-form__section__origin-ip-acl"
    :isDrawer="isDrawer"
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-2">
        <FieldSwitchBlock
          nameField="active"
          name="active"
          auto
          :isCard="false"
          :value="active"
          title="Active"
          data-testid="edge-connectors-form__status__active-field"
        />
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import { useField } from 'vee-validate'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'

  defineOptions({ name: 'EdgeConnectorsFormFieldsStatus' })

  defineProps({
    isDrawer: {
      type: Boolean,
      default: false
    }
  })

  const { value: active } = useField('active')
</script>
