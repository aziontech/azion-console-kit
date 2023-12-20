<script setup>
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import FormFieldsEdgeApplicationCacheSettings from '../FormFields/FormFieldsEdgeApplicationCacheSettings'
  import * as yup from 'yup'
  import { refDebounced } from '@vueuse/core'
  import { ref } from 'vue'

  defineOptions({
    name: 'edge-application-cache-settings-drawer'
  })
  const emit = defineEmits(['onSuccess'])

  const props = defineProps({
    edgeApplicationId: {
      type: String,
      required: true
    }
  })

  const showCreateCacheSettingsDrawer = ref(false)
  const debouncedDrawerAnimate = 300

  const showCreateDrawer = refDebounced(showCreateCacheSettingsDrawer, debouncedDrawerAnimate)

  const MAX_TTL_ONE_YEAR_IN_SECONDS = 31536000
  const LOCKED_SLICE_RANGE_IN_KBYTES = 1024

  const initialValues = ref({
    id: props.edgeApplicationId,
    name: '',
    browserCacheSettings: 'honor',
    browserCacheSettingsMaximumTtl: 0,
    cdnCacheSettings: 'honor',
    cdnCacheSettingsMaximumTtl: 60,
    sliceConfigurationEnabled: false,
    sliceConfigurationRange: LOCKED_SLICE_RANGE_IN_KBYTES,
    cacheByQueryString: 'ignore',
    queryStringFields: '',
    enableQueryStringSort: false,
    enableCachingForPost: false,
    enableCachingForOptions: false,
    enableStaleCache: false,
    cacheByCookies: 'ignore',
    cookieNames: '',
    adaptiveDeliveryAction: 'ignore',
    deviceGroup: [{ id: '' }]
  })
  const validationSchema = yup.object({
    name: yup.string().required().label('Name'),
    browserCacheSettings: yup.string().required().label('Browser cache settings'),
    browserCacheSettingsMaximumTtl: yup
      .number()
      .label('Maximum TTL')
      .transform((value) => (Number.isNaN(value) ? null : value))
      .when('browserCacheSettings', {
        is: 'honor',
        then: (schema) => schema.notRequired(),
        otherwise: (schema) => schema.min(0).max(MAX_TTL_ONE_YEAR_IN_SECONDS).required()
      }),
    cdnCacheSettings: yup.string().required().label('Edge cache settings'),
    cdnCacheSettingsMaximumTtl: yup
      .number()
      .label('Edge Maximum TTL')
      .transform((value) => (Number.isNaN(value) ? null : value))
      .when('cdnCacheSettings', {
        is: 'honor',
        then: (schema) => schema.notRequired(),
        otherwise: (schema) => schema.min(60).max(MAX_TTL_ONE_YEAR_IN_SECONDS).required()
      }),
    sliceConfigurationEnabled: yup.boolean().required(),
    sliceConfigurationRange: yup
      .number()
      .label('Slice Configuration Range')
      .transform((value) => (Number.isNaN(value) ? null : value))
      .when('sliceConfigurationEnabled', {
        is: false,
        then: (schema) => schema.notRequired(),
        otherwise: (schema) =>
          schema.required().min(LOCKED_SLICE_RANGE_IN_KBYTES).max(LOCKED_SLICE_RANGE_IN_KBYTES)
      }),
    cacheByQueryString: yup.string().required().label('Cache by query string'),
    queryStringFields: yup
      .string()
      .label('Query string fields')
      .when('cacheByQueryString', {
        is: (value) => ['whitelist', 'blacklist'].includes(value),
        then: (schema) => schema.required()
      }),
    enableQueryStringSort: yup.boolean(),
    enableCachingForPost: yup.boolean(),
    enableCachingForOptions: yup.boolean(),
    enableStaleCache: yup.boolean(),
    cacheByCookies: yup.string().required().label('Cache by cookies'),
    cookieNames: yup
      .string()
      .label('Cookie Names')
      .when('cacheByCookies', {
        is: (value) => ['whitelist', 'blacklist'].includes(value),
        then: (schema) => schema.required()
      }),
    adaptiveDeliveryAction: yup.string().label('Adaptive Delivery Action'),
    deviceGroup: yup.array().of(
      yup.object().shape({
        id: yup.string().required().label('Device group id').nonNullable()
      })
    )
  })

  const closeCreateDrawer = () => {
    showCreateCacheSettingsDrawer.value = false
  }
  const openCreateDrawer = () => {
    showCreateCacheSettingsDrawer.value = true
  }

  const handleCreateCacheSettings = () => {
    emit('onSuccess')
    closeCreateDrawer()
  }

  defineExpose({
    openCreateDrawer
  })
</script>

<template>
  <CreateDrawerBlock
    v-if="showCreateDrawer"
    v-model:visible="showCreateCacheSettingsDrawer"
    :createService="
      () => ({
        feedback: 'Criado com sucesso'
      })
    "
    :schema="validationSchema"
    :initialValues="initialValues"
    @onSuccess="handleCreateCacheSettings"
    title="Create Cache Settings"
  >
    <template #formFields>
      <FormFieldsEdgeApplicationCacheSettings />
    </template>
  </CreateDrawerBlock>
</template>
