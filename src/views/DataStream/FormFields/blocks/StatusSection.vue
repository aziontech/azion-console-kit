<template>
  <FormHorizontal
    title="Status"
    data-testid="data-stream-form__section__status"
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-2">
        <FieldSwitchBlock
          :disabled="hasNoPermissionToEditDataStream"
          nameField="status"
          name="status"
          :value="status"
          auto
          :isCard="false"
          title="Active"
          data-testid="data-stream-form__status__status-field"
        />
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import { useField } from 'vee-validate'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import { useAccountStore } from '@/stores/account'
  import { computed } from 'vue'

  const store = useAccountStore()

  const hasNoPermissionToEditDataStream = computed(() => !store.hasPermissionToEditDataStream)

  const { value: status } = useField('status')
</script>
