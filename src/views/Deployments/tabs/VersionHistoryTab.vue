<script setup>
  import { computed, ref, onBeforeUnmount } from 'vue'
  import Menu from '@aziontech/webkit/menu'
  import PrimeButton from '@aziontech/webkit/button'
  import PrimeTag from '@aziontech/webkit/prime-tag'
  import { useToast } from '@aziontech/webkit/use-toast'
  import { clipboardWrite } from '@/helpers/clipboard'
  import { deploymentVersionService } from '@/services/v2/deployment/deployment-version-service'
  import {
    VERSION_POLL_INTERVAL_MS,
    hasTransientVersions
  } from '@/services/v2/versioning/version-cache-policy'
  import { buildVersionRowActions } from './version-history-row-actions'
  import VersionListDataView from '@/components/VersionListDataView'
  import '@/assets/styles/version-row-menu.css'

  defineOptions({ name: 'deployment-version-history-tab' })

  const props = defineProps({
    deploymentId: {
      type: [String, Number],
      required: true
    }
  })

  const toast = useToast()

  const ACTIVE_STATES = ['ready', 'active']
  const isActiveVersion = (state) => ACTIVE_STATES.includes(state)

  const columns = [
    { key: 'version', label: 'Version', size: 'minmax(180px, 1.2fr)' },
    { key: 'status', label: 'Status', size: 'minmax(200px, 1fr)' },
    { key: 'modified', field: 'lastModified', label: 'Modified', size: 'minmax(160px, 1fr)' },
    { key: 'author', field: 'lastEditor', label: 'Author', size: 'minmax(180px, 1.2fr)' },
    { key: 'actions', label: '', mobileLabel: 'Actions', size: '44px', align: 'end' }
  ]

  const statusFilter = {
    key: 'state',
    placeholder: 'All statuses',
    defaultValue: '',
    options: [
      { label: 'All statuses', value: '' },
      { label: 'Draft', value: 'draft' },
      { label: 'Queued', value: 'queued' },
      { label: 'Building', value: 'building' },
      { label: 'Ready', value: 'ready' },
      { label: 'Active', value: 'active' },
      { label: 'Archived', value: 'archived' },
      { label: 'Canceled', value: 'canceled' },
      { label: 'Error', value: 'error' }
    ]
  }

  const items = ref([])
  const totalRecords = ref(0)
  const isLoading = ref(false)
  const isError = ref(false)
  const hasAnyVersions = ref(false)
  const page = ref(1)
  const pageSize = ref(20)
  const searchTerm = ref('')
  const stateFilter = ref('')

  const filterValues = computed(() => ({ state: stateFilter.value }))

  let pollTimer = null

  const stopPolling = () => {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  const syncPolling = () => {
    const transient = hasTransientVersions({ body: items.value })
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
      if (stateFilter.value) params.state = stateFilter.value
      if (skipCache) params.skipCache = true

      const { body, count } = await deploymentVersionService.listVersionsService(
        props.deploymentId,
        params
      )

      items.value = body
      totalRecords.value = count
      if (!searchTerm.value && !stateFilter.value) hasAnyVersions.value = count > 0
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

  const onFilterChange = (values) => {
    stateFilter.value = values?.state ?? ''
    page.value = 1
    fetchVersions()
  }

  const onPage = (event) => {
    page.value = (event?.page ?? 0) + 1
    pageSize.value = event?.rows ?? pageSize.value
    fetchVersions()
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
    :filters="[statusFilter]"
    :filter-values="filterValues"
    :show-row-actions="false"
    search-placeholder="Search versions"
    :empty-state="{
      title: 'This deployment has no versions yet',
      description: 'Each configuration change creates a new version.'
    }"
    :error-state="{
      title: 'Failed to load versions',
      description: 'Something went wrong loading this deployment’s versions. Try again.',
      buttonLabel: 'Retry',
      buttonAction: () => fetchVersions({ skipCache: true })
    }"
    filtered-empty-title="No versions found"
    filtered-empty-description="Try a different search or filter."
    data-testid="deployment-version-history"
    @update:search-term="onSearch"
    @update:filter-values="onFilterChange"
    @page="onPage"
    class="mt-4"
  >
    <template #cell-version="{ item }">
      <span
        class="text-body-sm text-[var(--text-color)] break-all"
        data-testid="deployment-version-history__id"
      >
        {{ item.id }}
      </span>
    </template>

    <template #cell-status="{ item }">
      <PrimeTag
        v-if="isActiveVersion(item.state)"
        value="Current"
        severity="success"
        data-testid="deployment-version-history__status-active"
      />
      <span
        v-else
        class="text-body-sm text-[var(--text-color-secondary)]"
        data-testid="deployment-version-history__status-historical"
      >
        Historical
      </span>
    </template>

    <template #cell-modified="{ item }">
      <span class="text-body-sm text-[var(--text-color)]">
        {{ item.lastModified || '--' }}
      </span>
    </template>

    <template #cell-author="{ item }">
      <span
        class="text-body-sm text-[var(--text-color)]"
        data-sentry-mask
      >
        {{ item.lastEditor || '--' }}
      </span>
    </template>

    <template #cell-actions="{ item }">
      <PrimeButton
        icon="pi pi-ellipsis-v"
        text
        severity="secondary"
        class="version-row-menu__trigger"
        aria-label="Version actions"
        :data-testid="`deployment-version-history__menu-${item.id}`"
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
</template>
