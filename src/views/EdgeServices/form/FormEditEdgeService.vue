<script setup>
  import EditFormBlock from '@/templates/edit-form-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import FormCreateEdgeService from './FormCreateEdgeService.vue'
  import * as yup from 'yup'

  const props = defineProps({
    loadService: { type: Function, required: true },
    editService: { type: Function, required: true },
    updatedRedirect: { type: String, required: true },
    showActionBar: { type: Boolean, required: false, default: true }
  })

  const validationSchema = yup.object({
    name: yup.string().required(),
    code: yup.string(),
    active: yup.boolean()
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
