<script setup>
  import EditFormBlock from '@/templates/edit-form-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import FormCreateEdgeService from './FormFieldsEdgeService.vue'
  import * as yup from 'yup'

  const props = defineProps({
    loadService: { type: Function, required: true },
    editService: { type: Function, required: true },
    updatedRedirect: { type: String, required: true },
    showActionBar: { type: Boolean, default: true }
  })

  const validateCode = (val = '') => {
    const split = val.split(/\s*\n+\s*/).filter((row) => !!row)
    const isValid = split.every((row) => /^\w+\s*=[^]+$/.test(row))
    return isValid
  }

  const validationSchema = yup.object({
    name: yup.string().required(),
    active: yup.boolean(),
    code: yup.string().test('formatInvalid', 'The format is invalid', validateCode)
  })
</script>

<template>
  <div class="mt-4">
    <EditFormBlock
      :editService="props.editService"
      :loadService="props.loadService"
      :updatedRedirect="updatedRedirect"
      :schema="validationSchema"
    >
      <template #form>
        <FormCreateEdgeService />
      </template>
      <template
        #action-bar="{ onSubmit, formValid, onCancel, loading }"
        v-if="props.showActionBar"
      >
        <ActionBarTemplate
          @onSubmit="onSubmit"
          @onCancel="onCancel"
          :loading="loading"
          :submitDisabled="!formValid"
        />
      </template>
    </EditFormBlock>
  </div>
</template>
