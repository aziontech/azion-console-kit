<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Create Team"
        data-testid="teams-permissions__create-view__page-heading"
      />
    </template>
    <template #content>
      <CreateFormBlock
        :createService="props.createTeamPermissionsService"
        :cleanFormCallback="resetForm"
        :schema="validationSchema"
        :initialValues="initialValues"
        @on-response="handleTrackSuccessCreated"
        @on-response-fail="handleTrackFailCreated"
      >
        <template #form>
          <FormFieldsTeamPermissions :listPermissionService="props.listPermissionService" />
        </template>
        <template #action-bar="{ onSubmit, onCancel, loading }">
          <ActionBarTemplate
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
          />
        </template>
      </CreateFormBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import { inject } from 'vue'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import CreateFormBlock from '@/templates/create-form-block'
  import FormFieldsTeamPermissions from './FormFields/FormFieldsTeamPermissions.vue'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'

  import * as yup from 'yup'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
    createTeamPermissionsService: {
      type: Function,
      required: true
    },
    listPermissionService: {
      type: Function,
      required: true
    }
  })

  const validationSchema = yup.object({
    name: yup.string().required('Name is a required field'),
    permissions: yup.array().required('Permission is a required field').min(1),
    isActive: yup.boolean()
  })

  const initialValues = {
    name: '',
    permissions: [],
    isActive: true
  }

  const handleTrackSuccessCreated = () => {
    tracker.product.productCreated({
      productName: 'Teams Permissions'
    })
  }

  const handleTrackFailCreated = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToCreate({
        productName: 'Teams Permissions',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }
</script>
