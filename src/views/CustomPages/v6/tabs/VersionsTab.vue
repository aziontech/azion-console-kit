<script setup>
  // VersionsTab — the version LISTING body of the v6 Custom Pages screen.
  // Lists every version with search/filter/sort and per-row actions
  // (Clone / Archive / Delete). Clicking a version opens its full editor.
  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useToast } from '@aziontech/webkit/use-toast'
  import PrimeButton from '@aziontech/webkit/button'

  import VersionListDataView from '@/components/VersionListDataView'
  import VersionActionDialog from '@/templates/version-shell-block/components/VersionActionDialog.vue'

  import { customPageVersionService } from '@/services/v2/custom-page/custom-page-version-service'
  import { useVersionList } from '@/composables/versioning/use-version-list'
  import { useVersionRowActions } from '@/composables/versioning/use-version-row-actions'

  defineOptions({ name: 'custom-pages-v6-versions-tab' })

  const props = defineProps({
    customPageId: {
      type: [String, Number],
      required: true
    }
  })

  const router = useRouter()
  const toast = useToast()

  const customPageId = computed(() => String(props.customPageId))
  const isCreatingDraft = ref(false)

  const versionsQuery = customPageVersionService.useListVersionsQuery(customPageId.value)
  const rawVersions = computed(() => versionsQuery.data.value?.body ?? [])

  const { items, searchTerm, filterValues, sort, filters, sortOptions } =
    useVersionList(rawVersions)

  const columns = [
    { key: 'version', label: 'Version' },
    { key: 'created', label: 'Created by' }
  ]

  const goToVersion = (versionIdOrObject) => {
    const id = typeof versionIdOrObject === 'string' ? versionIdOrObject : versionIdOrObject?.id
    if (!id) return
    router.push(`/custom-pages/edit/${customPageId.value}/versions/${id}`)
  }

  const {
    handleRowAction,
    dialogConfig,
    dialogProps,
    dialogVisible,
    handleConfirm,
    handleVisibility
  } = useVersionRowActions({
    resourceId: customPageId,
    service: customPageVersionService,
    onCloned: goToVersion,
    onSuccess: () => versionsQuery.refetch?.()
  })

  const createDraft = async () => {
    if (isCreatingDraft.value) return
    isCreatingDraft.value = true
    try {
      const draft = await customPageVersionService.createDraft(customPageId.value, {})
      if (draft?.id) goToVersion(draft.id)
    } catch (err) {
      if (err && typeof err.showErrors === 'function') {
        err.showErrors(toast)
      } else {
        toast.add({
          closable: true,
          severity: 'error',
          summary: 'Error',
          detail: err?.message ?? 'Falha ao criar uma nova versão. Tente novamente.'
        })
      }
    } finally {
      isCreatingDraft.value = false
    }
  }
</script>

<template>
  <div data-testid="custom-pages-v6-versions-tab">
    <VersionListDataView
      :items="items"
      :columns="columns"
      :loading="versionsQuery.isLoading.value"
      :is-error="versionsQuery.isError?.value ?? false"
      :has-versions="rawVersions.length > 0"
      :search-term="searchTerm"
      :filters="filters"
      :filter-values="filterValues"
      :sort="sort"
      :sort-options="sortOptions"
      :show-row-actions="true"
      :paginator-rows="10"
      search-placeholder="Buscar versões"
      :empty-state="{
        title: 'Esta Custom Page ainda não tem versões',
        description:
          'Crie a primeira versão para começar a configurar esta Custom Page com o fluxo de versionamento v6.',
        buttonLabel: 'Nova Versão',
        buttonAction: createDraft
      }"
      :error-state="{
        title: 'Falha ao carregar versões',
        description: 'Algo deu errado ao carregar as versões desta Custom Page. Tente novamente.',
        buttonLabel: 'Tentar novamente',
        buttonAction: () => versionsQuery.refetch?.()
      }"
      filtered-empty-title="Nenhuma versão corresponde aos filtros"
      filtered-empty-description="Tente outro termo de busca ou filtro de status."
      data-testid="custom-pages-v6-versions__table"
      @update:search-term="searchTerm = $event"
      @update:filter-values="filterValues = $event"
      @update:sort="sort = $event"
      @refresh="versionsQuery.refetch?.()"
      @row-click="goToVersion"
      @row-action="handleRowAction"
    >
      <template #toolbar-actions>
        <PrimeButton
          v-if="rawVersions.length > 0"
          label="Nova Versão"
          icon="pi pi-plus"
          size="small"
          :loading="isCreatingDraft"
          data-testid="custom-pages-v6-versions__new-draft"
          @click="createDraft"
        />
      </template>
    </VersionListDataView>

    <VersionActionDialog
      v-if="dialogConfig"
      v-bind="dialogProps"
      :visible="dialogVisible"
      @confirm="handleConfirm"
      @update:visible="handleVisibility"
    />
  </div>
</template>
