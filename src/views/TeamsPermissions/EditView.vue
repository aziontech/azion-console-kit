<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        :pageTitle="teamName"
        data-testid="teams-permissions__edit-view__page-heading"
        description="Configure permissions for team collaboration."
      />
    </template>
    <template #content>
      <EditFormBlock
        @on-load-fail="handleLoadFail"
        :editService="props.editTeamPermissionService"
        :loadService="props.loadTeamPermissionService"
        :updatedRedirect="updatedRedirect"
        :schema="validationSchema"
        @loaded-service-object="setTeamName"
        @on-edit-success="handleTrackSuccessEdit"
        @on-edit-fail="handleTrackFailEdit"
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
      </EditFormBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import { inject, ref } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import { useBreadcrumbs } from '@/stores/breadcrumbs'
  import EditFormBlock from '@/templates/edit-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import FormFieldsTeamPermissions from './FormFields/FormFieldsTeamPermissions.vue'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'

  import * as yup from 'yup'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  const route = useRoute()
  const breadcrumbs = useBreadcrumbs()
  const teamName = ref('Edit Team Permission')

  const setTeamName = (team) => {
    teamName.value = team.name
    breadcrumbs.update(route.meta.breadCrumbs ?? [], route, team.name)
  }

  const props = defineProps({
    editTeamPermissionService: {
      type: Function,
      required: true
    },
    loadTeamPermissionService: {
      type: Function,
      required: true
    },
    listPermissionService: {
      type: Function,
      required: true
    },
    updatedRedirect: {
      type: String,
      required: true
    }
  })

  const router = useRouter()

  const handleLoadFail = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    router.push({ name: 'teams-permission' })
    tracker.product
      .failedToEdit({
        productName: 'Teams Permissions',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }

  const validationSchema = yup.object({
    name: yup.string().required('Name is a required field'),
    permissions: yup.array().required('Permission is a required field').min(1),
    isActive: yup.boolean()
  })

  const handleTrackSuccessEdit = () => {
    tracker.product
      .productEdited({
        productName: 'Teams Permissions'
      })
      .track()
  }
  const handleTrackFailEdit = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToEdit({
        productName: 'Teams Permissions',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }
</script>
