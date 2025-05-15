<template>
  <FormAccordion
    :schema="validationSchema"
    :initialValues="initialValues"
    :createService="createCacheSetting"
    @on-response="handleResponse"
    disabledCallback
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
  import { useRoute } from 'vue-router'

  const props = defineProps({
    createCacheSettingsService: {
      type: Function,
      required: true
    }
  })

  const emit = defineEmits(['createdCache'])

  const route = useRoute()
  const edgeApplicationId = ref(route.params.id)

  const validationSchema = yup.object({
    cdnCacheSettingsMaximumTtl: yup.number().required().label('Maximum TTL '),
    browserCacheSettingsMaximumTtl: yup.number().label('Maximum TTL'),
    browserCacheSettings: yup.string().required(),
    cdnCacheSettings: yup.string().required()
  })

  const initialValues = ref({
    name: 'Default Cache Settings',
    browserCacheSettings: 'override',
    browserCacheSettingsMaximumTtl: 0,
    cdnCacheSettings: 'override',
    cdnCacheSettingsMaximumTtl: 60,
    enableCachingForPost: false,
    enableCachingForOptions: false,
    enableStaleCache: true,
    l2CachingEnabled: false,
    l2Region: null,
    cacheByQueryString: 'ignore',
    queryStringFields: null,
    enableQueryStringSort: false,
    cacheByCookies: 'ignore',
    cookieNames: null,
    adaptiveDeliveryAction: 'ignore',
    deviceGroup: [],
    sliceConfigurationEnabled: false,
    isSliceEdgeCachingEnabled: false,
    isSliceL2CachingEnabled: false,
    sliceConfigurationRange: 1024
  })

  const createCacheSetting = async (payload) => {
    return props.createCacheSettingsService({
      edgeApplicationId: edgeApplicationId.value,
      ...payload
    })
  }

  const handleResponse = (value) => {
    emit('createdCache', value)
  }
</script>
