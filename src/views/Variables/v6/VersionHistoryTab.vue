<script setup>
  import { ref, onBeforeUnmount } from 'vue'
  import Menu from '@aziontech/webkit/menu'
  import PrimeButton from '@aziontech/webkit/button'
  import PrimeTag from '@aziontech/webkit/prime-tag'
  import { useToast } from '@aziontech/webkit/use-toast'
  import { clipboardWrite } from '@/helpers/clipboard'
  import { variablesV6Service } from '@/services/v2/variables/v6/variables-v6-service'
  import { VERSION_POLL_INTERVAL_MS } from '@/services/v2/versioning/version-cache-policy'
  import { useTablePageSize } from '@/composables/useTablePageSize'
  import { isProcessing } from '@/composables/versioning/version-machine'
  import { buildVersionRowActions } from '@/views/Variables/v6/version-row-actions'
  import RevertDialog from '@/views/Variables/v6/components/RevertDialog.vue'
  import VersionListDataView from '@/components/VersionListDataView'
  import VersionStateBadge from '@/templates/version-shell-block/components/VersionStateBadge.vue'
  import '@/assets/styles/version-row-menu.css'

  defineOptions({ name: 'variables-version-history-tab' })

  const props = defineProps({
    variable: {
      type: Object,
      required: true
    }
  })

  const emit = defineEmits(['reverted'])

  const toast = useToast()

  const columns = [
    { key: 'version', label: 'Version', size: 'minmax(180px, 1.2fr)' },
    { key: 'status', label: 'Status', size: 'minmax(120px, 0.7fr)' },
    { key: 'modified', field: 'lastModified', label: 'Modified', size: 'minmax(160px, 1fr)' },
    { key: 'author', field: 'lastEditor', label: 'Author', size: 'minmax(180px, 1.2fr)' },
    { key: 'actions', label: '', mobileLabel: 'Actions', size: '44px', align: 'end' }
  ]

  const items = ref([])
  const totalRecords = ref(0)
  const isLoading = ref(false)
  const isError = ref(false)
  const hasAnyVersions = ref(false)
  const page = ref(1)
  const { pageSize, setPageSize } = useTablePageSize()
  const searchTerm = ref('')

  let pollTimer = null

  const stopPolling = () => {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  const hasTransientVersions = () =>
    items.value.some((version) => isProcessing(version?.versionState))

  const syncPolling = () => {
    const transient = hasTransientVersions()
    if (transient && !pollTimer) {
      pollTimer = setInterval(() => {
        fetchVersions({ skipCache: true, silent: true })
      }, VERSION_POLL_INTERVAL_MS)
    } else if (!transient) {
      stopPolling()
    }
  }

  const fetchVersions = async ({ skipCache = false, silent = false } = {}) => {
    if (!silent) isLoading.value = true
    isError.value = false
    try {
      const params = { page: page.value, pageSize: pageSize.value }
      if (searchTerm.value) params.search = searchTerm.value
      if (skipCache) params.skipCache = true

      const { count, body } = await variablesV6Service.listVersions({
        id: props.variable.id,
        ...params
      })

      items.value = body
      totalRecords.value = count
      if (!searchTerm.value) hasAnyVersions.value = count > 0
      syncPolling()
    } catch {
      if (!silent) {
        isError.value = true
        items.value = []
      }
      stopPolling()
    } finally {
      if (!silent) isLoading.value = false
    }
  }

  let searchTimer = null
  const onSearch = (value) => {
    searchTerm.value = value
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      page.value = 1
      fetchVersions()
    }, 300)
  }

  const onPage = (event) => {
    page.value = (event?.page ?? 0) + 1
    setPageSize(event?.rows ?? pageSize.value)
    fetchVersions()
  }

  const revertVisible = ref(false)
  const selectedVersion = ref(null)

  const openRevert = (version) => {
    selectedVersion.value = version
    revertVisible.value = true
  }

  const copyVersionId = async (version) => {
    try {
      await clipboardWrite(version?.id)
      toast.add({
        closable: true,
        severity: 'success',
        summary: 'Success',
        detail: 'Version ID copied to clipboard'
      })
    } catch {
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to copy the version ID'
      })
    }
  }

  const rowHandlers = {
    onRevert: openRevert,
    onCopy: copyVersionId
  }

  const rowMenuRef = ref(null)
  const rowMenuModel = ref([])

  const openRowMenu = (event, version) => {
    event?.stopPropagation?.()
    rowMenuModel.value = buildVersionRowActions(version, rowHandlers).map((action) => ({
      label: action.label,
      icon: action.icon,
      command: ({ originalEvent } = {}) => {
        originalEvent?.stopPropagation?.()
        action.execute()
      }
    }))
    rowMenuRef.value?.toggle?.(event)
  }

  const handleRevertSuccess = async () => {
    await fetchVersions({ skipCache: true })
    emit('reverted')
  }

  onBeforeUnmount(() => {
    if (searchTimer) clearTimeout(searchTimer)
    stopPolling()
  })

  fetchVersions()
</script>

<template>
  <VersionListDataView
    :items="items"
    :columns="columns"
    :loading="isLoading"
    :is-error="isError"
    :has-versions="hasAnyVersions"
    lazy
    :total-records="totalRecords"
    :paginator-rows="pageSize"
    :search-term="searchTerm"
    :show-row-actions="false"
    search-placeholder="Search versions"
    :empty-state="{
      title: 'This variable has no versions yet',
      description: 'Each edit creates a new version. Revert restores an earlier value.'
    }"
    :error-state="{
      title: 'Failed to load versions',
      description: 'Something went wrong loading this variable’s versions. Try again.',
      buttonLabel: 'Retry',
      buttonAction: () => fetchVersions({ skipCache: true })
    }"
    filtered-empty-title="No versions found"
    filtered-empty-description="Try a different search term."
    data-testid="variables-version-history"
    @update:search-term="onSearch"
    @page="onPage"
    class="mt-4"
  >
    <template #cell-version="{ item }">
      <span
        class="text-body-sm text-[var(--text-color)] break-all"
        data-testid="variables-version-history__id"
      >
        {{ item.id }}
      </span>
    </template>

    <template #cell-status="{ item }">
      <PrimeTag
        v-if="item.isCurrent"
        value="Current"
        severity="success"
        data-testid="variables-version-history__status-current"
      />
      <VersionStateBadge
        v-else-if="isProcessing(item.versionState)"
        :state="item.versionState"
        data-testid="variables-version-history__status-transient"
      />
      <span
        v-else
        class="text-body-sm text-[var(--text-color-secondary)]"
        data-testid="variables-version-history__status-historical"
      >
        Historical
      </span>
    </template>

    <template #cell-actions="{ item }">
      <PrimeButton
        icon="pi pi-ellipsis-v"
        text
        severity="secondary"
        class="version-row-menu__trigger"
        aria-label="Version actions"
        :data-testid="`variables-version-history__menu-${item.id}`"
        @click="openRowMenu($event, item)"
      />
    </template>
  </VersionListDataView>

  <Menu
    ref="rowMenuRef"
    :popup="true"
    :model="rowMenuModel"
    appendTo="body"
    class="version-row-menu"
    :pt="{ root: { style: 'min-width: 16rem' } }"
  >
    <template #item="{ item, props: itemProps }">
      <a
        class="version-row-menu__item"
        v-bind="itemProps.action"
      >
        <span
          v-if="item.icon"
          class="version-row-menu__icon"
          :class="item.icon"
          aria-hidden="true"
        />
        <span class="version-row-menu__label whitespace-nowrap">{{ item.label }}</span>
      </a>
    </template>
  </Menu>

  <RevertDialog
    v-model:visible="revertVisible"
    :variable="props.variable"
    :targetVersion="selectedVersion"
    @success="handleRevertSuccess"
  />
</template>
