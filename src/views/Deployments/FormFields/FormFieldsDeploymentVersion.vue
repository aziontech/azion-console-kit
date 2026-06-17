<script setup>
  import { computed, reactive, watch } from 'vue'
  import { useField } from 'vee-validate'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal.vue'
  import FieldText from '@aziontech/webkit/field-text'
  import FieldTextArea from '@aziontech/webkit/field-text-area'
  import FieldDropdown from '@aziontech/webkit/field-dropdown'
  import FieldSwitchBlock from '@aziontech/webkit/field-switch-block'
  import InputNumber from '@aziontech/webkit/inputnumber'
  import LabelBlock from '@aziontech/webkit/label'
  import PrimeButton from '@aziontech/webkit/button'
  import Dropdown from '@aziontech/webkit/dropdown'
  import { listResourceVersionsService } from '@/services/v2/deployment/deployment-mock'
  import {
    resourceRegistry,
    hasResourceListing
  } from '@/views/Deployments/helpers/deployment-resource-registry'
  import {
    resourcePackTypeMeta,
    normalizeText
  } from '@/views/Deployments/helpers/deployment-status'
  import StatusTag from '@/views/Deployments/components/StatusTag.vue'

  defineOptions({ name: 'form-fields-deployment-version' })

  const props = defineProps({
    disabledFields: { type: Boolean, default: false },
    isEdit: { type: Boolean, default: false },
    readonly: { type: Boolean, default: false },
    lockedEntries: { type: Boolean, default: false },
    status: { type: Object, default: () => ({ content: 'Draft', severity: 'info' }) },
    audit: { type: Object, default: () => null }
  })

  const { value: name } = useField('name')
  const { value: description } = useField('description')
  const { value: environment } = useField('environment')
  const { value: deploymentPolicy } = useField('deploymentPolicy')
  const { value: deploymentStrategy } = useField('deploymentStrategy')
  const { value: gradualDeploymentEnabled } = useField('gradualDeploymentEnabled')
  const { value: gradualVersion } = useField('gradualVersion')
  const { value: trafficPercentage } = useField('trafficPercentage')
  const { value: resourcePackEntries, errorMessage: resourcePackEntriesError } =
    useField('resourcePackEntries')

  const resourceTypeOptions = resourcePackTypeMeta.map((meta) => ({
    label: meta.label,
    value: meta.key,
    icon: meta.icon
  }))

  const getResourceTypeMeta = (key) => resourcePackTypeMeta.find((meta) => meta.key === key) || null

  const entries = computed(() => {
    const value = resourcePackEntries.value
    return Array.isArray(value) ? value : []
  })

  const setEntries = (next) => {
    resourcePackEntries.value = next
  }

  const updateEntry = (index, patch) => {
    const next = entries.value.map((entry, itemIndex) =>
      itemIndex === index ? { ...entry, ...patch } : entry
    )
    setEntries(next)
  }

  const resourcesByKind = reactive({})
  const versionsByKey = reactive({})
  const loadingResources = reactive({})
  const loadingVersions = reactive({})

  const versionsCacheKey = (kind, resourceName) => `${kind}:::${resourceName}`

  const resolveFieldText = (value) => {
    if (value == null) return ''
    if (typeof value === 'string' || typeof value === 'number') return String(value)
    if (typeof value === 'object') {
      if (typeof value.text === 'string') return value.text
      if (typeof value.content === 'string') return value.content
      if (typeof value.label === 'string') return value.label
      if (typeof value.name === 'string') return value.name
    }
    return ''
  }

  const ensureResourcesLoaded = async (kind) => {
    if (!kind || resourcesByKind[kind] || loadingResources[kind]) return
    const entry = resourceRegistry[kind]
    if (!entry) {
      resourcesByKind[kind] = []
      return
    }
    loadingResources[kind] = true
    try {
      const response = await entry.list(entry.defaultParams)
      const items = Array.isArray(response?.body)
        ? response.body
        : Array.isArray(response?.data)
          ? response.data
          : []
      resourcesByKind[kind] = items
        .map((item) => {
          const rawId = item?.[entry.idField] ?? item?.id ?? item?.name
          const rawLabel = item?.[entry.labelField] ?? item?.name ?? item?.id
          const id = resolveFieldText(rawId)
          const label = resolveFieldText(rawLabel) || id
          if (!id) return null
          return { id, name: label }
        })
        .filter(Boolean)
    } catch {
      resourcesByKind[kind] = []
    } finally {
      loadingResources[kind] = false
    }
  }

  const ensureVersionsLoaded = async (kind, resourceName) => {
    if (!kind || !resourceName) return
    const key = versionsCacheKey(kind, resourceName)
    if (versionsByKey[key] || loadingVersions[key]) return
    loadingVersions[key] = true
    try {
      const response = await listResourceVersionsService(kind, resourceName)
      versionsByKey[key] = Array.isArray(response?.data) ? response.data : []
    } catch {
      versionsByKey[key] = [{ value: 'latest', label: 'latest' }]
    } finally {
      loadingVersions[key] = false
    }
  }

  const getResourceOptions = (kind) => resourcesByKind[kind] || []
  const isResourcesLoading = (kind) => !!loadingResources[kind]
  const getVersionOptions = (kind, resourceName) =>
    versionsByKey[versionsCacheKey(kind, resourceName)] || []
  const isVersionsLoading = (kind, resourceName) =>
    !!loadingVersions[versionsCacheKey(kind, resourceName)]

  const handleKindChange = async (index, value) => {
    updateEntry(index, { kind: value, name: '', hash: '' })
    await ensureResourcesLoaded(value)
  }

  const handleResourceChange = async (index, value) => {
    const entry = entries.value[index]
    updateEntry(index, { name: value, hash: 'latest' })
    await ensureVersionsLoaded(entry?.kind, value)
  }

  const handleVersionChange = (index, value) => {
    updateEntry(index, { hash: value })
  }

  const primeEntryLookups = (entry) => {
    if (!entry?.kind) return
    ensureResourcesLoaded(entry.kind)
    if (entry.name) {
      ensureVersionsLoaded(entry.kind, entry.name)
    }
  }

  watch(
    entries,
    (next) => {
      next.forEach(primeEntryLookups)
    },
    { immediate: true, deep: true }
  )

  const addResourceEntry = () => {
    setEntries([...entries.value, { kind: '', name: '', hash: 'latest' }])
  }

  const removeResourceEntry = (index) => {
    // eslint-disable-next-line id-length
    setEntries(entries.value.filter((_, itemIndex) => itemIndex !== index))
  }

  const usedResourceKinds = computed(
    () => new Set(entries.value.map((entry) => entry.kind).filter(Boolean))
  )

  const isResourceTypeOptionDisabled = (option, currentKind) => {
    if (option.value === currentKind) return false
    return usedResourceKinds.value.has(option.value)
  }

  const environmentOptions = [
    { label: 'Development', value: 'development' },
    { label: 'Staging', value: 'staging' },
    { label: 'Production', value: 'production' }
  ]

  const deploymentPolicyOptions = [
    { label: 'Auto-approve', value: 'auto-approve' },
    { label: 'Manual approval', value: 'manual-approve' },
    { label: 'Two-step approval', value: 'two-step' }
  ]

  const deploymentStrategyOptions = [
    { label: 'All-at-once', value: 'all-at-once' },
    { label: 'Rolling', value: 'rolling' },
    { label: 'Blue / Green', value: 'blue-green' },
    { label: 'Canary', value: 'canary' }
  ]

  const gradualVersionOptions = [
    { label: 'v2.4.0 — current', value: 'v2.4.0' },
    { label: 'v2.3.9', value: 'v2.3.9' },
    { label: 'v2.3.8', value: 'v2.3.8' }
  ]

  const allFieldsDisabled = computed(() => props.disabledFields || props.readonly)

  const entrySelectionLocked = computed(() => allFieldsDisabled.value || props.lockedEntries)

  const statusLabel = computed(() => props.status?.content || 'Unknown')

  const buildTriggerIcon = computed(() => {
    const triggerType = normalizeText(props.audit?.buildTriggerType)
    if (triggerType === 'cli') return 'pi pi-angle-double-right'
    if (triggerType === 'api') return 'pi pi-code'
    return 'pi pi-desktop'
  })

  const auditMetadataPretty = computed(() => {
    if (!props.audit?.auditMetadata) return ''
    try {
      return JSON.stringify(props.audit.auditMetadata, null, 2)
    } catch {
      return ''
    }
  })
</script>

<template>
  <div
    v-if="props.isEdit && props.readonly"
    class="flex items-start gap-3 rounded-md border border-[var(--surface-border)] bg-[color-mix(in_srgb,var(--text-color-secondary)_10%,transparent)] px-4 py-3 text-sm leading-6 text-[var(--text-color)]"
    data-testid="deployment-version-form__readonly-banner"
  >
    <i class="pi pi-lock mt-1 text-[var(--text-color-secondary)]" />
    <div class="flex flex-col gap-1">
      <span>
        This version is in <strong>{{ statusLabel }}</strong> state and cannot be modified.
        Duplicate it as a Draft to make changes.
      </span>
    </div>
  </div>

  <FormHorizontal
    :isDrawer="true"
    title="Identification"
    description="Identify this deployment version with a name and an optional description."
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-4">
        <FieldText
          label="Name"
          name="name"
          required
          placeholder="e.g. Production Release v2.5.0"
          description="Pre-filled with the deployment name. Edit if you want a more descriptive label."
          :value="name"
          :disabled="allFieldsDisabled"
          data-testid="deployment-version-form__name-field"
        />

        <FieldTextArea
          label="Description"
          name="description"
          placeholder="What's in this version? Why are you publishing it?"
          description="Optional. Provide context that explains this deployment version."
          :value="description"
          :disabled="allFieldsDisabled"
          data-testid="deployment-version-form__description-field"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    :isDrawer="true"
    title="Version composition"
    description="Pin a specific version of each resource to compose this immutable bundle."
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-3">
        <LabelBlock label="Resource versions" />

        <div
          v-if="entries.length === 0"
          class="rounded-md border border-dashed border-[var(--surface-border)] px-4 py-6 text-center text-sm text-[var(--text-color-secondary)]"
          data-testid="deployment-version-form__resources-empty"
        >
          No resources added yet. Click <strong>Add resource</strong> to pin one.
        </div>

        <div
          v-for="(entry, index) in entries"
          :key="index"
          class="grid grid-cols-1 gap-2 rounded-md border border-[var(--surface-border)] p-3 md:grid-cols-[200px_1fr_180px_auto] md:items-center"
          data-testid="deployment-version-form__resource-row"
        >
          <Dropdown
            :modelValue="entry.kind"
            :options="resourceTypeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Resource type"
            appendTo="self"
            class="w-full"
            :disabled="entrySelectionLocked"
            :optionDisabled="(option) => isResourceTypeOptionDisabled(option, entry.kind)"
            @update:modelValue="(value) => handleKindChange(index, value)"
            :data-testid="`deployment-version-form__resource-kind-${index}`"
          >
            <template #option="slotProps">
              <span class="inline-flex items-center gap-2">
                <i
                  v-if="slotProps.option.icon"
                  :class="slotProps.option.icon"
                  class="text-sm text-[var(--text-color-secondary)]"
                />
                <span>{{ slotProps.option.label }}</span>
              </span>
            </template>
            <template #value="slotProps">
              <span
                v-if="slotProps.value"
                class="inline-flex items-center gap-2"
              >
                <i
                  v-if="getResourceTypeMeta(slotProps.value)?.icon"
                  :class="getResourceTypeMeta(slotProps.value)?.icon"
                  class="text-sm text-[var(--text-color-secondary)]"
                />
                <span>{{ getResourceTypeMeta(slotProps.value)?.label }}</span>
              </span>
              <span
                v-else
                class="text-[var(--text-color-secondary)]"
                >{{ slotProps.placeholder }}</span
              >
            </template>
          </Dropdown>

          <Dropdown
            :modelValue="entry.name"
            :options="getResourceOptions(entry.kind)"
            optionLabel="name"
            optionValue="name"
            :placeholder="
              !entry.kind
                ? 'Select a resource type first'
                : !hasResourceListing(entry.kind)
                  ? 'Listing not available for this type'
                  : isResourcesLoading(entry.kind)
                    ? 'Loading resources…'
                    : 'Resource ID'
            "
            :loading="isResourcesLoading(entry.kind)"
            :disabled="
              entrySelectionLocked ||
              !entry.kind ||
              !hasResourceListing(entry.kind) ||
              isResourcesLoading(entry.kind)
            "
            :emptyMessage="
              isResourcesLoading(entry.kind)
                ? 'Loading…'
                : !hasResourceListing(entry.kind)
                  ? 'Listing not available for this type'
                  : 'No resources available for this type'
            "
            appendTo="self"
            class="w-full"
            @update:modelValue="(value) => handleResourceChange(index, value)"
            :data-testid="`deployment-version-form__resource-name-${index}`"
          />

          <Dropdown
            :modelValue="entry.hash"
            :options="getVersionOptions(entry.kind, entry.name)"
            optionLabel="label"
            optionValue="value"
            :placeholder="
              !entry.name
                ? 'Select a resource first'
                : isVersionsLoading(entry.kind, entry.name)
                  ? 'Loading versions…'
                  : 'Version'
            "
            :loading="isVersionsLoading(entry.kind, entry.name)"
            :disabled="
              allFieldsDisabled || !entry.name || isVersionsLoading(entry.kind, entry.name)
            "
            :emptyMessage="
              isVersionsLoading(entry.kind, entry.name) ? 'Loading…' : 'No versions available'
            "
            appendTo="self"
            class="w-full"
            @update:modelValue="(value) => handleVersionChange(index, value)"
            :data-testid="`deployment-version-form__resource-hash-${index}`"
          />

          <PrimeButton
            v-if="!props.lockedEntries"
            icon="pi pi-trash"
            type="button"
            outlined
            severity="secondary"
            size="small"
            :disabled="allFieldsDisabled"
            @click="removeResourceEntry(index)"
            :data-testid="`deployment-version-form__resource-remove-${index}`"
            aria-label="Remove resource"
          />
        </div>

        <div v-if="!props.lockedEntries">
          <PrimeButton
            label="Add resource"
            icon="pi pi-plus"
            type="button"
            text
            size="small"
            :disabled="allFieldsDisabled"
            @click="addResourceEntry"
            data-testid="deployment-version-form__resources-add"
          />
        </div>

        <small
          v-if="resourcePackEntriesError"
          class="p-error text-xs font-normal leading-tight"
        >
          {{ resourcePackEntriesError }}
        </small>
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    :isDrawer="true"
    title="Environment &amp; publishing"
    description="Define the target stage and the optional publish domain for this version."
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-4">
        <div class="flex gap-4">
          <FieldDropdown
            label="Environment"
            name="environment"
            required
            :options="environmentOptions"
            :value="environment"
            optionLabel="label"
            optionValue="value"
            appendTo="self"
            :disabled="allFieldsDisabled"
            data-testid="deployment-version-form__environment-field"
          />

          <div
            v-if="props.isEdit"
            class="flex flex-col gap-2.5"
          >
            <LabelBlock label="Status" />
            <StatusTag
              :status="props.status"
              data-testid="deployment-version-form__status-badge"
            />
          </div>
        </div>
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    :isDrawer="true"
    title="Deploy strategy"
    description="Choose how this version is approved and how traffic shifts to it."
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-4">
        <FieldDropdown
          label="Deployment policy"
          name="deploymentPolicy"
          :options="deploymentPolicyOptions"
          :value="deploymentPolicy"
          optionLabel="label"
          optionValue="value"
          appendTo="self"
          description="Governance policy for this version."
          :disabled="allFieldsDisabled"
          data-testid="deployment-version-form__policy-field"
        />

        <FieldDropdown
          label="Deployment strategy"
          name="deploymentStrategy"
          :options="deploymentStrategyOptions"
          :value="deploymentStrategy"
          optionLabel="label"
          optionValue="value"
          appendTo="self"
          description="How traffic moves to this version."
          :disabled="allFieldsDisabled"
          data-testid="deployment-version-form__strategy-field"
        />

        <FieldSwitchBlock
          nameField="gradualDeploymentEnabled"
          name="gradualDeploymentEnabled"
          :isCard="true"
          title="Gradual deployment"
          subtitle="Route a percentage of traffic to this version before promoting it fully."
          :disabled="allFieldsDisabled"
          data-testid="deployment-version-form__gradual-field"
        />

        <div
          v-if="gradualDeploymentEnabled"
          class="flex flex-col gap-4 rounded-md border border-[var(--surface-border)] p-4"
        >
          <FieldDropdown
            label="Compare against version"
            name="gradualVersion"
            :options="gradualVersionOptions"
            :value="gradualVersion"
            optionLabel="label"
            optionValue="value"
            appendTo="self"
            description="The current production version traffic will shift away from."
            :disabled="allFieldsDisabled"
            data-testid="deployment-version-form__gradual-version-field"
          />

          <div class="flex flex-col gap-2">
            <LabelBlock label="Traffic percentage" />
            <InputNumber
              v-model="trafficPercentage"
              :min="0"
              :max="100"
              suffix=" %"
              showButtons
              :disabled="allFieldsDisabled"
              data-testid="deployment-version-form__traffic-field"
            />
            <small class="text-xs text-color-secondary font-normal leading-5">
              {{ trafficPercentage || 0 }}% of requests will reach this version.
            </small>
          </div>
        </div>
      </div>
    </template>
  </FormHorizontal>

  <FieldSwitchBlock
    nameField="skewProtectionEnabled"
    name="skewProtectionEnabled"
    title="Skew protection"
    subtitle="Prevent clients on an older version from hitting incompatible new code."
    :disabled="allFieldsDisabled"
    data-testid="deployment-version-form__skew-field"
  />
  <FormHorizontal
    v-if="props.isEdit && props.audit"
    :isDrawer="true"
    title="Audit"
    description="Immutable metadata captured when this version was built."
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-3 rounded-md border border-[var(--surface-border)] p-4">
        <div
          v-if="props.audit.buildTriggerType"
          class="flex items-center justify-between text-sm leading-6"
        >
          <span class="text-[var(--text-color-secondary)]">Build trigger</span>
          <span class="inline-flex items-center gap-1.5 text-[var(--text-color)]">
            <i
              :class="buildTriggerIcon"
              class="text-xs text-[var(--text-color-secondary)]"
            />
            {{ props.audit.buildTriggerType }}
          </span>
        </div>
        <div
          v-if="props.audit.triggeredByUser"
          class="flex items-center justify-between text-sm leading-6"
        >
          <span class="text-[var(--text-color-secondary)]">Triggered by</span>
          <span class="text-[var(--text-color)]">{{ props.audit.triggeredByUser }}</span>
        </div>
        <div
          v-if="props.audit.createdAt"
          class="flex items-center justify-between text-sm leading-6"
        >
          <span class="text-[var(--text-color-secondary)]">Created at</span>
          <span class="font-mono text-[var(--text-color)]">{{ props.audit.createdAt }}</span>
        </div>
        <div
          v-if="props.audit.versionId"
          class="flex items-center justify-between text-sm leading-6"
        >
          <span class="text-[var(--text-color-secondary)]">Version ID</span>
          <span class="font-mono text-[var(--text-color)]">{{ props.audit.versionId }}</span>
        </div>
        <div
          v-if="auditMetadataPretty"
          class="flex flex-col gap-1"
        >
          <span class="text-sm leading-6 text-[var(--text-color-secondary)]">Audit metadata</span>
          <pre
            class="m-0 max-h-64 overflow-auto rounded border border-[var(--surface-border)] bg-[var(--surface-ground)] p-3 font-mono text-xs leading-5 text-[var(--text-color)]"
            >{{ auditMetadataPretty }}</pre
          >
        </div>
      </div>
    </template>
  </FormHorizontal>
</template>
