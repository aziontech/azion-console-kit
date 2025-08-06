<template>
  <ContentBlock data-testid="create-edge-sql-database-content-block">
    <template #heading>
      <PageHeadingBlock
        pageTitle="Create Database"
        data-testid="create-edge-sql-database-heading"
      />
    </template>
    <template #content>
      <CreateFormBlock
        @on-response="handleTrackCreation"
        @on-response-fail="handleTrackFailedCreation"
        :createService="createDatabaseServiceWithMonitoring"
        :schema="validationSchema"
        :initialValues="initialValues"
        :disableAfterCreateToastFeedback="true"
        data-testid="create-edge-sql-database-form-block"
      >
        <template #form>
          <FormFieldsCreateDatabase data-testid="create-edge-sql-database-form-fields" />
        </template>

        <template #action-bar="{ onSubmit, onCancel, loading }">
          <ActionBarBlockWithTeleport
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
            data-testid="create-edge-sql-database-action-bar"
          />
        </template>
      </CreateFormBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import CreateFormBlock from '@/templates/create-form-block'
  import ActionBarBlockWithTeleport from '@templates/action-bar-block/action-bar-with-teleport'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import FormFieldsCreateDatabase from './FormFields/FormFieldsCreateDatabase.vue'
  import { inject, ref } from 'vue'
  import * as yup from 'yup'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import { edgeSQLService } from '@/services/v2'
  import { useEdgeSQLStatusManager } from '@/composables/use-edge-sql-status-manager'
  import { useToast } from 'primevue/usetoast'

  defineOptions({ name: 'create-edge-sql-database' })

  const tracker = inject('tracker')
  const toast = useToast()

  const { addCreateOperation } = useEdgeSQLStatusManager()

  const validationSchema = yup.object({
    name: yup
      .string()
      .required('Database name is required')
      .min(6, 'Database name must be at least 6 characters')
      .max(50, 'Database name must be at most 50 characters')
      .matches(/^[a-zA-Z0-9-]+$/, 'Use only letters, numbers and hyphen (-)')
  })

  const initialValues = ref({
    name: ''
  })
  const createDatabaseServiceWithMonitoring = async (payload) => {
    const result = await edgeSQLService.createDatabase(payload)

    // Só monitora se realmente for assíncrono (retorna status creating/pending)
    if (result.shouldMonitor && result.databaseId) {
      // Para databases que retornam "created" direto, não precisa polling
      // Para databases que retornam "creating", precisa polling
      addCreateOperation(result.databaseId, result.databaseName, (status, operation) => {
        if (status === 'failed') {
          toast.add({
            severity: 'error',
            summary: 'Creation Failed',
            detail: `Failed to create database "${result.databaseName}". ${
              operation.error || 'Please try again.'
            }`,
            life: 6000
          })
        }
      })
    }

    // Sempre redireciona para listagem
    result.urlToEditView = '/edge-sql'

    return result
  }

  const handleTrackCreation = () => {
    tracker.product?.productCreated({
      productName: 'Edge SQL Database',
      from: 'list',
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

  const handleTrackFailedCreation = (error) => {
    let errorInfo

    if (error.response?.data?.errors?.[0]) {
      errorInfo = parseApiError(error)
    } else if (typeof error === 'string') {
      errorInfo = parseStringError(error)
    } else {
      errorInfo = parseGenericError(error)
    }

    tracker.product?.failedToCreate({
      productName: 'Edge SQL Database',
      errorType: 'api',
      fieldName: errorInfo.fieldName.trim(),
      errorMessage: errorInfo.message
    })?.track()
  }
</script>
