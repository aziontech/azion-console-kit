<script setup>
  import { computed, ref, watch } from 'vue'
  import { useForm } from 'vee-validate'
  import * as yup from 'yup'
  import { useToast } from '@aziontech/webkit/use-toast'
  import PrimeButton from '@aziontech/webkit/button'
  import FormFieldsDeploymentVersion from '@/views/Deployments/FormFields/FormFieldsDeploymentVersion.vue'
  import {
    createWorkloadVersionService,
    getWorkloadVersionStatsService
  } from '@/services/v2/workload/workload-versions-mock'
  import { edgeAppService } from '@/services/v2/edge-app/edge-app-service'
  import { edgeFirewallService } from '@/services/v2/edge-firewall/edge-firewall-service'
  import { customPageService } from '@/services/v2/custom-page/custom-page-service'
  import VersionHistorySection from './sections/VersionHistorySection.vue'

  defineOptions({ name: 'workload-version-tab' })

  const props = defineProps({
    workloadId: { type: [String, Number], required: true },
    workload: { type: Object, default: () => null }
  })

  const toast = useToast()

  const validationSchema = yup.object({
    name: yup.string().required().label('Name'),
    description: yup.string().nullable().default(''),
    environment: yup
      .string()
      .required()
      .oneOf(['development', 'staging', 'production'])
      .label('Environment'),
    deploymentPolicy: yup
      .string()
      .required()
      .oneOf(['auto-approve', 'manual-approve', 'two-step'])
      .label('Deployment policy'),
    deploymentStrategy: yup
      .string()
      .required()
      .oneOf(['all-at-once', 'rolling', 'blue-green', 'canary'])
      .label('Deployment strategy'),
    gradualDeploymentEnabled: yup.boolean().default(false),
    gradualVersion: yup.string().nullable().default(''),
    trafficPercentage: yup.number().min(0).max(100).default(10),
    skewProtectionEnabled: yup.boolean().default(false),
    resourcePackEntries: yup
      .array()
      .of(
        yup.object({
          kind: yup
            .string()
            .required()
            .oneOf(['application', 'firewall', 'customPage'])
            .label('Resource type'),
          name: yup.string().required().label('Resource name'),
          hash: yup.string().nullable().default('')
        })
      )
      .min(1, 'Pin at least one resource for this version.')
      .label('Resource versions')
      .default([])
  })

  const lockedEntries = ref([])

  const initialValues = computed(() => ({
    name: props.workload?.name ? `${props.workload.name} — Draft` : 'New Workload Version',
    description: '',
    environment: 'development',
    deploymentPolicy: 'manual-approve',
    deploymentStrategy: 'all-at-once',
    gradualDeploymentEnabled: false,
    gradualVersion: '',
    trafficPercentage: 10,
    skewProtectionEnabled: false,
    resourcePackEntries: lockedEntries.value.map((entry) => ({ ...entry }))
  }))

  const { handleSubmit, resetForm, isSubmitting } = useForm({
    validationSchema,
    initialValues: initialValues.value
  })

  watch(initialValues, (next) => resetForm({ values: next }))

  const stats = ref(null)
  const statsLoading = ref(true)

  const loadStats = async () => {
    statsLoading.value = true
    try {
      stats.value = await getWorkloadVersionStatsService(props.workloadId)
    } catch {
      stats.value = null
    } finally {
      statsLoading.value = false
    }
  }

  const lockedResourceSources = [
    {
      kind: 'application',
      idKey: 'application',
      load: (id) => edgeAppService.loadEdgeApplicationService({ id })
    },
    {
      kind: 'firewall',
      idKey: 'firewall',
      load: (id) => edgeFirewallService.loadEdgeFirewallService({ id })
    },
    {
      kind: 'customPage',
      idKey: 'customPage',
      load: (id) => customPageService.loadCustomPagesService({ id })
    }
  ]

  const loadLockedEntries = async () => {
    const sources = lockedResourceSources
      .map((source) => ({ source, id: props.workload?.[source.idKey] }))
      .filter(({ id }) => id !== null && id !== undefined && id !== '')

    if (sources.length === 0) {
      lockedEntries.value = []
      return
    }

    const results = await Promise.allSettled(sources.map(({ source, id }) => source.load(id)))

    let hasFailure = false
    lockedEntries.value = results.map((result, index) => {
      const { source, id } = sources[index]
      if (result.status === 'fulfilled') {
        const resolvedName = result.value?.name || String(id)
        return { kind: source.kind, name: resolvedName, hash: '' }
      }
      hasFailure = true
      return { kind: source.kind, name: String(id), hash: '' }
    })

    if (hasFailure) {
      toast.add({
        severity: 'warn',
        summary: 'Some pinned resources could not be loaded',
        detail: 'Showing IDs as a fallback. You can still pin a version.',
        life: 4000
      })
    }
  }

  watch(
    () => props.workloadId,
    () => {
      loadStats()
      loadLockedEntries()
    },
    { immediate: true }
  )

  watch(
    () => [props.workload?.application, props.workload?.firewall, props.workload?.customPage],
    () => {
      loadLockedEntries()
    }
  )

  const onCancel = () => {
    resetForm({ values: initialValues.value })
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      const resourcePack = (values.resourcePackEntries || []).reduce((acc, entry) => {
        if (!entry?.kind) return acc
        acc[entry.kind] = { name: entry.name, hash: entry.hash || 'latest' }
        return acc
      }, {})

      await createWorkloadVersionService(props.workloadId, {
        name: values.name,
        description: values.description,
        environment: values.environment,
        resourcePack
      })

      toast.add({
        severity: 'success',
        summary: 'Draft version created',
        detail: `${values.name} is now in Draft state.`,
        life: 3000
      })

      await loadLockedEntries()
      resetForm({ values: initialValues.value })
      await loadStats()
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Could not create version',
        detail: error?.message || 'Try again in a moment.',
        life: 4000
      })
    }
  })
</script>

<template>
  <div class="flex flex-col mt-4 gap-4">
    <div
      class="flex flex-col gap-4"
      data-testid="workload-version__form-section"
    >
      <form
        class="flex flex-col gap-6"
        @submit.prevent="onSubmit"
      >
        <FormFieldsDeploymentVersion
          :readonly="false"
          :lockedEntries="true"
        />

        <div class="flex flex-wrap items-center justify-end gap-2">
          <PrimeButton
            label="Cancel"
            type="button"
            severity="secondary"
            outlined
            @click="onCancel"
            data-testid="workload-version__form-cancel"
          />
          <PrimeButton
            :label="isSubmitting ? 'Saving…' : 'Save Draft'"
            type="submit"
            icon="pi pi-save"
            :loading="isSubmitting"
            data-testid="workload-version__form-submit"
          />
        </div>
      </form>
    </div>

    <VersionHistorySection :workloadId="workloadId" />
  </div>
</template>
