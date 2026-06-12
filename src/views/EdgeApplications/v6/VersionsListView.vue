<script setup>
  // v6 VersionsListView — gated by `use_v6_configurations`. Shown when the
  // user accesses /applications/edit/:id. Lists all of the application's versions
  // and leads to the v6 EditView (which renders VersionShell + Main Settings) when
  // clicking a row.
  //
  // Empty state: CTA "New Version" → POST /versions (no source) →
  // service invalidates cache → list refetches → navigates to the new draft.
  //
  // "New Version" in the header (when versions already exist): clones the most
  // recent ready/active version, or creates one from scratch if none is stable.
  import { computed, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from '@aziontech/webkit/use-toast'
  import ProgressSpinner from '@aziontech/webkit/progressspinner'
  import InlineMessage from '@aziontech/webkit/inlinemessage'
  import PrimeButton from '@aziontech/webkit/button'

  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import GenericDataView from '@/components/GenericDataView'
  import VersionStateDot from '@/templates/version-shell-block/components/VersionStateDot.vue'

  import { edgeAppService } from '@/services/v2/edge-app/edge-app-service'
  import { edgeAppVersionService } from '@/services/v2/edge-app/edge-app-version-service'
  import { formatDateToDayMonthYearHour } from '@/helpers/convert-date'

  defineOptions({ name: 'edge-applications-v6-versions-list-view' })

  const route = useRoute()
  const router = useRouter()
  const toast = useToast()

  const applicationId = computed(() => String(route.params.id))

  const application = ref(null)
  const isLoadingApplication = ref(true)
  const loadError = ref(null)
  const isCreatingDraft = ref(false)

  const loadApplication = async () => {
    isLoadingApplication.value = true
    loadError.value = null
    try {
      application.value = await edgeAppService.loadEdgeApplicationService({
        id: applicationId.value
      })
    } catch (err) {
      loadError.value = err
      application.value = null
    } finally {
      isLoadingApplication.value = false
    }
  }

  watch(applicationId, loadApplication, { immediate: true })

  const versionsQuery = edgeAppVersionService.useListVersionsQuery(applicationId.value)
  const rawVersions = computed(() => versionsQuery.data.value?.body ?? [])

  const searchTerm = ref('')

  const STATUS_OPTIONS = [
    { label: 'All Status', value: null },
    { label: 'Draft', value: 'draft' },
    { label: 'Building', value: 'building' },
    { label: 'Ready', value: 'ready' },
    { label: 'Active', value: 'active' },
    { label: 'Failed', value: 'failed' },
    { label: 'Cancelled', value: 'cancelled' },
    { label: 'Archived', value: 'archived' }
  ]

  const SORT_OPTIONS = [
    { label: 'Last modified', value: 'lastModified-desc' },
    { label: 'First created', value: 'createdAt-asc' },
    { label: 'Status', value: 'state-asc' }
  ]

  const filterValues = ref({
    state: null,
    sort: 'lastModified-desc'
  })

  const filters = computed(() => [
    {
      key: 'state',
      options: STATUS_OPTIONS,
      placeholder: 'All Status',
      defaultValue: null
    },
    {
      key: 'sort',
      options: SORT_OPTIONS,
      placeholder: 'Sort by',
      defaultValue: 'lastModified-desc'
    }
  ])

  const comparators = {
    'lastModified-desc': (left, right) =>
      String(right.lastModified || '').localeCompare(String(left.lastModified || '')),
    'createdAt-asc': (left, right) =>
      String(left.createdAt || '').localeCompare(String(right.createdAt || '')),
    'state-asc': (left, right) => String(left.state || '').localeCompare(String(right.state || ''))
  }

  const filteredVersions = computed(() => {
    const term = searchTerm.value.trim().toLowerCase()
    const stateFilter = filterValues.value.state
    const sortKey = filterValues.value.sort || 'lastModified-desc'

    const filtered = rawVersions.value.filter((version) => {
      if (stateFilter && version.state !== stateFilter) return false
      if (!term) return true
      const haystack = [version.id, version.state, version.comment]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })

    const comparator = comparators[sortKey] || comparators['lastModified-desc']
    return [...filtered].sort(comparator)
  })

  const STATE_NOTES = {
    failed: 'Build failed',
    cancelled: 'Cancelled'
  }

  const noteFor = (state) => STATE_NOTES[state] || null

  const columns = [
    { key: 'label', field: 'id', label: 'Version', size: 'minmax(220px, 1.4fr)' },
    { key: 'state', field: 'state', label: 'Status', size: 'minmax(180px, 1.2fr)' },
    { key: 'when', field: 'createdAt', label: 'Created', size: 'minmax(180px, 1.2fr)' }
  ]

  const goToVersion = (versionIdOrObject) => {
    const id = typeof versionIdOrObject === 'string' ? versionIdOrObject : versionIdOrObject?.id
    if (!id) return
    router.push(`/applications/edit/${applicationId.value}/versions/${id}`)
  }

  // POST /versions without source_version → API clones the most recent `ready`, or
  // creates the first version if the app is not versioned yet.
  const createDraft = async () => {
    if (isCreatingDraft.value) return
    isCreatingDraft.value = true
    try {
      const draft = await edgeAppVersionService.createDraft(applicationId.value, {})
      if (draft?.id) goToVersion(draft.id)
    } catch (err) {
      // A failed create is an action-scoped error: surface it as a toast and keep
      // the list mounted. It must NOT touch `loadError` (which gates the whole
      // view and would replace the listing with the load-error screen).
      if (err && typeof err.showErrors === 'function') {
        err.showErrors(toast)
      } else {
        toast.add({
          closable: true,
          severity: 'error',
          summary: 'Error',
          detail: err?.message ?? 'Failed to create a new version. Try again.'
        })
      }
    } finally {
      isCreatingDraft.value = false
    }
  }

  const pageTitle = computed(() => {
    const name = application.value?.name
    return name ? `${name} — Versions` : 'Versions'
  })

  const pageDescription =
    "Each version is an isolated snapshot of this Application's configuration. Edit a draft, then build it to publish an immutable version to the Edge."
</script>

<template>
  <div
    v-if="isLoadingApplication"
    class="flex items-center justify-center p-8"
    data-testid="edge-applications-v6-versions__loading"
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
    data-testid="edge-applications-v6-versions__error"
  >
    Failed to load application. Try refreshing the page.
  </InlineMessage>

  <ContentBlock
    v-else
    data-testid="edge-applications-v6-versions"
  >
    <template #heading>
      <PageHeadingBlock
        :pageTitle="pageTitle"
        :description="pageDescription"
        :entityName="application?.name"
      >
        <template #default>
          <PrimeButton
            icon="pi pi-refresh"
            outlined
            size="small"
            aria-label="Refresh versions"
            data-testid="edge-applications-v6-versions__refresh"
            :loading="versionsQuery.isFetching?.value"
            @click="versionsQuery.refetch?.()"
          />
          <PrimeButton
            v-if="rawVersions.length > 0"
            label="New Version"
            icon="pi pi-plus"
            size="small"
            :loading="isCreatingDraft"
            data-testid="edge-applications-v6-versions__new-draft"
            @click="createDraft"
          />
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <GenericDataView
        :items="filteredVersions"
        :columns="columns"
        :loading="versionsQuery.isLoading.value"
        :has-deployments="rawVersions.length > 0"
        :search-term="searchTerm"
        :filters="filters"
        :filter-values="filterValues"
        :show-row-actions="false"
        :paginator-rows="20"
        primary-column-key="label"
        search-placeholder="Search versions"
        empty-title="No versions yet"
        empty-description="This application has no versions. Create the first one to start configuring it."
        filtered-empty-title="No versions match your filters"
        filtered-empty-description="Try a different search term or status filter."
        data-testid="edge-applications-v6-versions__table"
        @update:search-term="searchTerm = $event"
        @update:filter-values="filterValues = $event"
        @refresh="versionsQuery.refetch?.()"
        @row-primary-click="goToVersion"
      >
        <template #cell-label="{ item }">
          <button
            type="button"
            class="inline-flex flex-wrap items-center gap-2 bg-transparent border-0 p-0 m-0 text-left cursor-pointer min-w-0 max-w-full text-[var(--text-color)]"
            :data-testid="`edge-applications-v6-versions__row-${item.id}`"
            @click="goToVersion(item)"
          >
            <span
              class="inline-flex items-center font-mono text-sm font-semibold leading-5 whitespace-nowrap px-[7px] py-[1px] rounded-[5px] border text-[var(--text-color)] bg-[var(--surface-section)] border-[var(--surface-border)]"
            >
              {{ item.id }}
            </span>
            <span
              v-if="item.state === 'active'"
              class="inline-flex items-center gap-1 text-[10.5px] leading-4 font-medium px-[7px] py-[2px] rounded bg-[color-mix(in_srgb,var(--primary-color)_15%,transparent)] text-[var(--primary-color)]"
            >
              <i
                class="pi pi-circle-on"
                style="font-size: 9px"
              />
              Current
            </span>
            <span
              v-if="item.comment"
              class="text-xs whitespace-nowrap overflow-hidden text-ellipsis min-w-0 max-w-full text-[var(--text-color-secondary)]"
            >
              {{ item.comment }}
            </span>
          </button>
        </template>

        <template #cell-state="{ item }">
          <button
            type="button"
            class="inline-flex items-center gap-2 bg-transparent border-0 p-0 m-0 text-left cursor-pointer min-w-0 max-w-full text-[var(--text-color)]"
            @click="goToVersion(item)"
          >
            <VersionStateDot :state="item.state" />
            <span
              v-if="noteFor(item.state)"
              class="inline-block text-[11px] leading-4 whitespace-nowrap px-[6px] py-[1px] rounded bg-[color-mix(in_srgb,var(--p-tag-warning-color)_12%,transparent)] text-[var(--p-tag-warning-color)]"
            >
              {{ noteFor(item.state) }}
            </span>
          </button>
        </template>

        <template #cell-when="{ item }">
          <button
            type="button"
            class="inline-block max-w-full overflow-hidden text-ellipsis whitespace-nowrap bg-transparent border-0 p-0 m-0 text-sm text-left cursor-pointer text-[var(--text-color-secondary)]"
            @click="goToVersion(item)"
          >
            {{ item.createdAt ? formatDateToDayMonthYearHour(item.createdAt) : '—' }}
          </button>
        </template>

        <template #empty>
          <div
            class="flex flex-col items-center justify-center gap-3 px-6 py-12 rounded-lg border border-dashed text-center border-[var(--surface-border)] bg-[var(--surface-section)]"
            data-testid="edge-applications-v6-versions__empty"
          >
            <h3 class="m-0 text-base font-semibold text-[var(--text-color)]">
              This application has no versions yet
            </h3>
            <p
              class="mt-0 mb-1 max-w-md text-sm leading-relaxed text-[var(--text-color-secondary)]"
            >
              Create the first version to start configuring this application with the v6 versioning
              workflow.
            </p>
            <PrimeButton
              label="New Version"
              icon="pi pi-plus"
              size="small"
              :loading="isCreatingDraft"
              data-testid="edge-applications-v6-versions__create-first"
              @click="createDraft"
            />
          </div>
        </template>
      </GenericDataView>
    </template>
  </ContentBlock>
</template>
