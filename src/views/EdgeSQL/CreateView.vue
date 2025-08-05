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

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  const toast = useToast()

  // Sistema de status manager para monitoramento
  const { addCreateOperation } = useEdgeSQLStatusManager()

  const validationSchema = yup.object({
    name: yup
      .string()
      .required('Database name is required')
      .matches(/^[a-zA-Z0-9_-]+$/, 'Use only letters, numbers, underscore (_) and hyphen (-)')
  })

  const initialValues = ref({
    name: ''
  })
  const createDatabaseServiceWithMonitoring = async (payload) => {
          const result = await edgeSQLService.createDatabase(payload)

    if (result.shouldMonitor && result.databaseId) {
      if (result.feedback) {
        toast.add({
          severity: 'success',
          summary: 'Creating Database',
          detail: result.feedback,
          life: 3000
        })
      }

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

    return result
  }

  const handleTrackCreation = () => {
    tracker.product?.productCreated({
      productName: 'Edge SQL Database',
      from: 'list',
      createdFrom: 'singleEntity'
    })
  }

  const handleTrackFailedCreation = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      ?.failedToCreate({
        productName: 'Edge SQL Database',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      ?.track()
  }
</script>
