<script setup>
  import { ref } from 'vue'
  import { useRoute } from 'vue-router'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import EditFormBlock from '@/templates/edit-form-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import FormFieldsEnvironment from '@/views/Environments/FormFields/FormFieldsEnvironment.vue'
  import { useBreadcrumbs } from '@/stores/breadcrumbs'
  import { validationSchema } from './Config/validation'
  import { loadEnvironmentByIdAdapter, updateEnvironmentAdapter } from './Config/adapters'

  defineOptions({ name: 'edit-environment' })

  defineProps({
    updatedRedirect: { type: String, required: true }
  })

  const route = useRoute()
  const breadcrumbs = useBreadcrumbs()

  const environmentName = ref('Edit Environment')

  const editService = (values) => updateEnvironmentAdapter(route.params.id, values)

  const handleLoadedEnvironment = (environment) => {
    if (!environment?.name) return
    environmentName.value = environment.name
    breadcrumbs.update(route.meta.breadCrumbs ?? [], route, environment.name)
  }
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        :pageTitle="environmentName"
        description="Update this environment's configuration."
      />
    </template>
    <template #content>
      <EditFormBlock
        :editService="editService"
        :loadService="loadEnvironmentByIdAdapter"
        :schema="validationSchema"
        :updatedRedirect="updatedRedirect"
        @loaded-service-object="handleLoadedEnvironment"
      >
        <template #form>
          <FormFieldsEnvironment isEdit />
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
