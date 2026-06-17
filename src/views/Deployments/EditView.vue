<script setup>
  import { ref } from 'vue'
  import { useRoute } from 'vue-router'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import EditFormBlock from '@/templates/edit-form-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import FormFieldsDeployment from '@/views/Deployments/FormFields/FormFieldsDeployment.vue'
  import { useBreadcrumbs } from '@/stores/breadcrumbs'
  import { validationSchema } from './Config/validation'
  import { loadDeploymentByIdAdapter, updateDeploymentAdapter } from './Config/adapters'

  defineOptions({ name: 'edit-deployment' })

  const route = useRoute()
  const breadcrumbs = useBreadcrumbs()

  const deploymentName = ref('Edit Deployment')

  const editService = (values) => updateDeploymentAdapter(route.params.id, values)

  const handleLoadedDeployment = (deployment) => {
    if (!deployment?.name) return
    deploymentName.value = deployment.name
    breadcrumbs.update(route.meta.breadCrumbs ?? [], route, deployment.name)
  }
</script>

<template>
  <ContentBlock data-testid="deployment-edit-content-block">
    <template #heading>
      <PageHeadingBlock
        :pageTitle="deploymentName"
        description="Update this deployment's configuration."
        data-testid="deployment-edit-heading"
      />
    </template>
    <template #content>
      <EditFormBlock
        :editService="editService"
        :loadService="loadDeploymentByIdAdapter"
        :schema="validationSchema"
        @loaded-service-object="handleLoadedDeployment"
      >
        <template #form>
          <FormFieldsDeployment isEdit />
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
