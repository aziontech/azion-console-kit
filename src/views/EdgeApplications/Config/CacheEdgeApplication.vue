<template>
  <FormAccordion
    :schema="validationSchema"
    :initialValues="initialValues"
    :createService="createCacheSettingServices"
  >
    <template #form>
      <FormFieldsCache></FormFieldsCache>
    </template>
    <template #action-bar-accordion="{ onSubmit, loading }">
      <ActionBarAccordion
        @onSubmit="onSubmit"
        :loading="loading"
        data-testid="create-edge-application-action-bar"
      />
    </template>
  </FormAccordion>
</template>
<script setup>
  import ActionBarAccordion from '@/templates/action-bar-block/action-bar-accordion.vue'
  import FormAccordion from '@/templates/create-form-block/form-accordion.vue'
  import FormFieldsCache from '../FormFields/FormFieldsCreateCacheSettings.vue'
  import * as yup from 'yup'
  import { ref } from 'vue'

  defineProps({
    createCacheServices: {
      type: Function,
      required: true
    }
  })

  const validationSchema = yup.object({
    cdnCacheSettingsMaximumTtl: yup.number().required().label('Maximum TTL '),
    browserCacheSettingsMaximumTtl: yup.number().label('Maximum TTL'),
    browserCacheSettings: yup.string().required(),
    cdnCacheSettings: yup.string().required()
  })

  const initialValues = ref({
    browserCacheSettings: 'override',
    browserCacheSettingsMaximumTtl: 0,
    cdnCacheSettings: 'override',
    cdnCacheSettingsMaximumTtl: 60
  })

  const createCacheSettingServices = async (values) => {
    return values
  }
</script>
