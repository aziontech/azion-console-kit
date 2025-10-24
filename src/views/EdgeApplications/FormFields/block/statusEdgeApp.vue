<template>
  <FormHorizontal
    title="Status"
    :isDrawer="isDrawer"
    description=""
  >
    <template #inputs>
      <div class="flex flex-col gap-2">
        <FieldSwitchBlock
          nameField="isActive"
          name="isActive"
          auto
          :isCard="false"
          title="Active"
          subtitle=""
          data-testid="form-horizontal-active-switch"
        />
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'

  defineProps({
    isDrawer: {
      type: Boolean
    }
  })
</script>
