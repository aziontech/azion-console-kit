<script setup>
  import { ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from '@aziontech/webkit/use-toast'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import EditFormBlock from '@/templates/edit-form-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import FormFieldsEnvironment from '@/views/Environments/FormFields/FormFieldsEnvironment.vue'
  import { useBreadcrumbs } from '@/stores/breadcrumbs'
  import { validationSchema } from './Config/validation'
  import { loadEnvironmentByIdAdapter, updateEnvironmentAdapter } from './Config/adapters'

  defineOptions({ name: 'edit-environment' })

  const props = defineProps({
    updatedRedirect: { type: String, required: true }
  })

  const route = useRoute()
  const router = useRouter()
  const toast = useToast()
  const breadcrumbs = useBreadcrumbs()

  const environmentName = ref('Edit Environment')
  const originalScopedVariables = ref(new Map())
  const scopedVariablesLoadFailed = ref(false)

  const formatFailedKeys = (failures = []) => {
    const keys = failures.map((failure) => failure.key)
    const preview = keys.slice(0, 5).join(', ')
    return keys.length > 5 ? `${preview}, ...` : preview
  }

  const editService = (values) =>
    updateEnvironmentAdapter(route.params.id, values, {
      originalScopedVariables: originalScopedVariables.value,
      scopedVariablesLoadFailed: scopedVariablesLoadFailed.value
    })

  const handleLoadedEnvironment = (environment) => {
    if (environment?.originalScopedVariables instanceof Map) {
      originalScopedVariables.value = environment.originalScopedVariables
    }
    scopedVariablesLoadFailed.value = !!environment?.scopedVariablesLoadFailed
    if (scopedVariablesLoadFailed.value) {
      toast.add({
        closable: true,
        severity: 'warn',
        summary: 'Could not load scoped variables',
        detail:
          environment?.scopedVariablesLoadError ??
          'Saving will skip variable sync to avoid data loss. Reload the page to try again.'
      })
    }
    if (!environment?.name) return
    environmentName.value = environment.name
    breadcrumbs.update(route.meta.breadCrumbs ?? [], route, environment.name)
  }

  const handleEditSuccess = (result) => {
    const failures = result?.variablesFailures ?? []
    const feedback = result?.feedback ?? 'Environment updated successfully'

    if (failures.length) {
      toast.add({
        closable: true,
        severity: 'warn',
        summary: 'Some variables failed',
        detail: `${feedback}, but ${failures.length} variable change(s) failed: ${formatFailedKeys(
          failures
        )}`
      })
    } else {
      toast.add({
        closable: true,
        severity: 'success',
        summary: 'Success',
        detail: feedback
      })
    }

    router.push({ name: props.updatedRedirect })
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
        disableRedirect
        disableAfterCreateToastFeedback
        @loaded-service-object="handleLoadedEnvironment"
        @on-edit-success="handleEditSuccess"
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
