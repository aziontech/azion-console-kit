<script setup>
  import { ref, computed, onBeforeUnmount } from 'vue'
  import Menu from '@aziontech/webkit/menu'
  import PrimeButton from '@aziontech/webkit/button'
  import PrimeTag from '@aziontech/webkit/prime-tag'
  import { useToast } from '@aziontech/webkit/use-toast'
  import { clipboardWrite } from '@/helpers/clipboard'
  import { digitalCertificatesV6Service } from '@/services/v2/digital-certificates/v6/digital-certificates-v6-service'
  import { digitalCertificatesCRLV6Service } from '@/services/v2/digital-certificates/v6/digital-certificates-crl-v6-service'
  import { buildVersionRowActions } from './version-row-actions'
  import RevertDialog from './components/RevertDialog.vue'
  import VersionListDataView from '@/components/VersionListDataView'
  import '@/assets/styles/version-row-menu.css'

  defineOptions({ name: 'digital-certificates-version-history-tab' })

  const props = defineProps({
    resource: {
      type: Object,
      required: true
    },
    resourceKind: {
      type: String,
      required: true
    }
  })

  const emit = defineEmits(['reverted'])

  const toast = useToast()

  const service = computed(() =>
    props.resourceKind === 'crl' ? digitalCertificatesCRLV6Service : digitalCertificatesV6Service
  )

  const resourceLabel = computed(() => (props.resourceKind === 'crl' ? 'CRL' : 'certificate'))

  const emptyStateTitle = computed(() =>
    props.resourceKind === 'crl'
      ? 'This CRL has no versions yet'
      : 'This certificate has no versions yet'
  )

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
  const pageSize = ref(20)
  const searchTerm = ref('')

  const fetchVersions = async ({ skipCache = false } = {}) => {
    isLoading.value = true
    isError.value = false
    try {
      const params = { page: page.value, pageSize: pageSize.value }
      if (searchTerm.value) params.search = searchTerm.value
      if (skipCache) params.skipCache = true

      const { count, body } = await service.value.listVersions({
        id: props.resource.id,
        ...params
      })

      items.value = body
      totalRecords.value = count
      if (!searchTerm.value) hasAnyVersions.value = count > 0
    } catch {
      isError.value = true
      items.value = []
    } finally {
      isLoading.value = false
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
    pageSize.value = event?.rows ?? pageSize.value
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
      title: emptyStateTitle,
      description: 'Each edit creates a new version. Revert restores an earlier configuration.'
    }"
    :error-state="{
      title: 'Failed to load versions',
      description: `Something went wrong loading this ${resourceLabel}’s versions. Try again.`,
      buttonLabel: 'Retry',
      buttonAction: () => fetchVersions({ skipCache: true })
    }"
    filtered-empty-title="No versions found"
    filtered-empty-description="Try a different search term."
    data-testid="digital-certificates-version-history"
    @update:search-term="onSearch"
    @page="onPage"
    class="mt-4"
  >
    <template #cell-version="{ item }">
      <span
        class="text-body-sm text-[var(--text-color)] break-all"
        data-testid="digital-certificates-version-history__id"
      >
        {{ item.id }}
      </span>
    </template>

    <template #cell-status="{ item }">
      <PrimeTag
        v-if="item.isCurrent"
        value="Current"
        severity="success"
        data-testid="digital-certificates-version-history__status-current"
      />
      <span
        v-else
        class="text-body-sm text-[var(--text-color-secondary)]"
        data-testid="digital-certificates-version-history__status-historical"
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
        :data-testid="`digital-certificates-version-history__menu-${item.id}`"
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
    :resource="props.resource"
    :targetVersion="selectedVersion"
    :revertService="service.revert"
    :resourceLabel="resourceLabel"
    @success="handleRevertSuccess"
  />
</template>
