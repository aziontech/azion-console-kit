<template>
  <FormHorizontal
    title="Debug Rules"
    :isDrawer="isDrawer"
    description="Log executed rules created in Rules Engine. Query logs using Data Stream, Real-Time Events, or Real-Time Events GraphQL API."
    data-testid="form-horizontal-debug-rules"
  >
    <template #inputs>
      <div class="flex flex-col gap-2">
        <FieldSwitchBlock
          nameField="debug"
          name="debug"
          auto
          :value="debug"
          :isCard="false"
          title="Active"
          subtitle="Rules that were successfully executed will be shown under the $traceback field in Data
              Streaming and Real-Time Events or the $stacktrace variable in GraphQL."
          data-testid="form-horizontal-debug-rules-switch"
        />
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'

  import { useField } from 'vee-validate'

  defineProps({
    isDrawer: {
      type: Boolean
    }
  })

  const { value: debug } = useField('debug')
</script>
