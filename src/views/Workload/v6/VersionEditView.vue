<script setup>
  import { computed, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from '@aziontech/webkit/use-toast'
  import ProgressSpinner from '@aziontech/webkit/progressspinner'
  import InlineMessage from '@aziontech/webkit/inlinemessage'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import WorkloadSettingsTab from '@/views/Workload/v6/WorkloadSettingsTab.vue'
  import { workloadService } from '@/services/v2/workload/workload-service'
  import { VERSION_ACTIONS } from '@/composables/versioning/version-machine'

  defineOptions({ name: 'workload-v6-version-edit-view' })

  const route = useRoute()
  const router = useRouter()
  const toast = useToast()

  const workloadId = computed(() => String(route.params.id))
  const versionId = computed(() => String(route.params.versionId))

  const workload = ref(null)
  const isLoading = ref(true)
  const loadError = ref(null)

  const loadWorkload = async () => {
    if (!workload.value) isLoading.value = true
    loadError.value = null
    try {
      workload.value = await workloadService.loadWorkload({ id: workloadId.value })
    } catch (err) {
      loadError.value = err
      workload.value = null
    } finally {
      isLoading.value = false
    }
  }

  watch(workloadId, loadWorkload, { immediate: true })

  const title = computed(() => workload.value?.name ?? '')

  const goToWorkload = () =>
    router.push({ name: 'edit-workload', params: { id: workloadId.value, tab: 'versions' } })

  const SUCCESS_SUMMARY = {
    [VERSION_ACTIONS.SAVE]: 'Versão salva',
    [VERSION_ACTIONS.SAVE_AND_BUILD]: 'Build iniciado',
    [VERSION_ACTIONS.CANCEL_BUILD]: 'Build cancelado',
    [VERSION_ACTIONS.NEW_DRAFT_FROM]: 'Rascunho criado',
    [VERSION_ACTIONS.ARCHIVE]: 'Versão arquivada',
    [VERSION_ACTIONS.DELETE]: 'Versão excluída'
  }

  const handleCommandSuccess = ({ action, result }) => {
    toast.add({
      closable: true,
      severity: 'success',
      summary: SUCCESS_SUMMARY[action] ?? 'Concluído'
    })

    switch (action) {
      case VERSION_ACTIONS.DELETE:
      case VERSION_ACTIONS.SAVE_AND_BUILD:
        goToWorkload()
        return
      case VERSION_ACTIONS.NEW_DRAFT_FROM:
        if (result?.id) {
          router.push({
            name: 'edit-workload-version',
            params: { id: workloadId.value, versionId: result.id }
          })
        }
        return
      case VERSION_ACTIONS.SAVE:
        loadWorkload()
        return
      default:
    }
  }

  const handleCommandError = ({ error }) => {
    if (error && typeof error.showErrors === 'function') {
      error.showErrors(toast)
      return
    }
    const detail = error?.message ?? (typeof error === 'string' ? error : 'Something went wrong')
    toast.add({ closable: true, severity: 'error', summary: 'Error', detail })
  }
</script>

<template>
  <div
    v-if="isLoading"
    class="flex items-center justify-center p-8"
    data-testid="workload-v6-version-edit__loading"
  >
    <ProgressSpinner
      class="w-10 h-10 text-color"
      strokeWidth="4"
    />
  </div>

  <InlineMessage
    v-else-if="loadError"
    class="w-full"
    severity="error"
    data-testid="workload-v6-version-edit__error"
  >
    Failed to load workload. Try refreshing the page.
  </InlineMessage>

  <ContentBlock
    v-else
    data-testid="workload-v6-version-edit"
  >
    <template #heading>
      <PageHeadingBlock
        :pageTitle="title"
        :entityName="workload?.name"
      >
        <template #default>
          <div
            id="version-lifecycle-action"
            class="flex items-center"
          />
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <WorkloadSettingsTab
        v-if="workload"
        :key="versionId"
        :workload="workload"
        :resource-id="workloadId"
        :version-id="versionId"
        @command-success="handleCommandSuccess"
        @command-error="handleCommandError"
        @cancel="goToWorkload"
      />
    </template>
  </ContentBlock>
</template>
