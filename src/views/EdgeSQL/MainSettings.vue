<template>
  <EditFormBlock
    @on-response="handleResponse"
    @on-response-fail="handleTrackFailedUpdate"
    :editService="edgeSQLService.updateDatabase"
    :schema="validationSchema"
    :loadService="mockLoadService"
    :initialValues="initialValues"
    disableToast
    data-testid="edit-edge-sql-database-form-block"
  >
    <template #form>
      <FormFieldsMainSettings data-testid="edit-edge-sql-database-form-fields" />
    </template>

    <template #action-bar="{ onSubmit, onCancel, loading }">
      <ActionBarBlockWithTeleport
        @onSubmit="onSubmit"
        @onCancel="onCancel"
        :loading="loading"
        data-testid="edit-edge-sql-database-action-bar"
      />
    </template>
  </EditFormBlock>
</template>

<script setup>
  import EditFormBlock from '@/templates/edit-form-block'
  import ActionBarBlockWithTeleport from '@templates/action-bar-block/action-bar-with-teleport'
  import FormFieldsMainSettings from './FormFields/FormFieldsMainSettings.vue'
  import { inject, computed } from 'vue'
  import { useRoute } from 'vue-router'
  import * as yup from 'yup'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import { edgeSQLService } from '@/services/v2/edge-sql/edge-sql-service'

  defineOptions({ name: 'edit-edge-sql-database' })

  const props = defineProps({
    database: {
      type: Object,
      required: true
    }
  })

  const tracker = inject('tracker')
  const route = useRoute()

  const validationSchema = yup.object({
    name: yup
      .string()
      .required('Database name is required')
      .min(6, 'Database name must be at least 6 characters')
      .max(50, 'Database name must be at most 50 characters')
      .matches(/^[a-zA-Z0-9-]+$/, 'Use only letters, numbers and hyphen (-)')
  })

  const initialValues = computed(() => {
    return props.database
  })

  const mockLoadService = () => {
    return props.database
  }

  const handleResponse = () => {
    handleTrackUpdate()
  }

  const handleTrackUpdate = () => {
    tracker.product?.productUpdated({
      productName: 'Edge SQL Database',
      from: route.query.origin || 'list',
      createdFrom: 'singleEntity'
    })
  }

  const parseApiError = (error) => {
    const apiError = error.response?.data?.errors?.[0]
    if (!apiError) return null

    return {
      fieldName: apiError.source?.pointer || 'api',
      message: `${apiError.title}: ${apiError.detail}`
    }
  }

  const parseStringError = (error) => {
    const trackerResult = handleTrackerError(error)
    return {
      fieldName: trackerResult.fieldName,
      message: trackerResult.message
    }
  }

  const parseGenericError = (error) => {
    return {
      fieldName: 'no field',
      message: error.message || error.toString() || 'Failed to create database'
    }
  }

  const handleTrackFailedUpdate = (error) => {
    let errorInfo

    if (error.response?.data?.errors?.[0]) {
      errorInfo = parseApiError(error)
    } else if (typeof error === 'string') {
      errorInfo = parseStringError(error)
    } else {
      errorInfo = parseGenericError(error)
    }

    tracker.product
      ?.failedToUpdate({
        productName: 'Edge SQL Database',
        errorType: 'api',
        fieldName: errorInfo.fieldName.trim(),
        errorMessage: errorInfo.message
      })
      ?.track()
  }
</script>
