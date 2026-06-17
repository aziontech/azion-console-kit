<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import InputText from '@aziontech/webkit/inputtext'
  import LabelBlock from '@aziontech/webkit/label'
  import CopyBlock from '@aziontech/webkit/button-copy'
  import PrimeButton from '@aziontech/webkit/button'
  import CollapsibleCard from '@/components/CollapsibleCard'
  import DomainRow from '../components/DomainRow.vue'
  import DomainDrawer from '../components/DomainDrawer.vue'
  import { useFieldArray, useField } from 'vee-validate'
  import { ref, computed, onMounted, watch } from 'vue'
  import { edgeDNSService } from '@/services/v2/edge-dns/edge-dns-service'
  import { environmentService } from '@/services/v2/environment/environment-service'
  import { digitalCertificatesService } from '@/services/v2/digital-certificates/digital-certificates-service'

  const props = defineProps({
    isDrawer: {
      type: Boolean,
      required: false
    },
    noBorder: {
      type: Boolean,
      required: false
    },
    isEdit: {
      type: Boolean,
      required: false
    }
  })

  const { errorMessage: domainsErrorMessage, value: domains } = useField('domains')
  const { push: pushDomain, remove, update: updateDomain } = useFieldArray('domains')
  const { value: workloadHostname } = useField('workloadHostname')
  const { value: workloadName } = useField('name')
  const { value: useCustomDomain, setValue: setUseCustomDomain } = useField('useCustomDomain')
  const { value: customDomain, setValue: setCustomDomain } = useField('customDomain')
  const { value: useHttps } = useField('protocols.http.useHttps')

  const domainsOptions = ref([])
  const certificateOptions = ref([])
  const certificateLoading = ref(true)
  const environmentMap = ref({})

  const drawerVisible = ref(false)
  const drawerMode = ref('create')
  const editingIndex = ref(null)
  const drawerInitialData = ref(null)
  const firstDomainTouched = ref(false)

  const ensureEnvironmentInfo = async (envId) => {
    if (!envId || environmentMap.value[envId]) return
    try {
      const env = await environmentService.loadEnvironmentService({ id: envId })
      if (env?.id != null) {
        environmentMap.value[env.id] = {
          name: env.name,
          deployment_version_policy: env.deployment_version_policy
        }
      }
    } catch {
      // intentionally swallowed: env label is non-blocking UX
    }
  }

  const environmentName = (envId) => environmentMap.value[envId]?.name ?? ''

  const isUrlVersionedEnv = (envId) => {
    return environmentMap.value[envId]?.deployment_version_policy === 'versioned_urls'
  }

  const buildAzionDomain = (name) => {
    const sanitized = (name ?? '').replace(/\s+/g, '')
    return sanitized ? `${sanitized}.azion.app` : ''
  }

  const sugestionDomains = async () => {
    const domainsRes = await edgeDNSService.listEdgeDNSService({
      fields: ['id', 'domain'],
      active: 'True' //To-Do: replace with true (boolean type) once API is fixed
    })
    domainsOptions.value = domainsRes.body.map((domain) => ({
      label: domain.domain.content,
      value: domain.id
    }))
  }

  const fetchCertificates = async () => {
    certificateLoading.value = true
    try {
      const response = await digitalCertificatesService.listDigitalCertificatesDropdown({
        type: 'edge_certificate',
        fields: ['id,name,status,authority,type,subject_name'],
        pageSize: 100,
        page: 1,
        ordering: 'name'
      })

      certificateOptions.value = response.body.flatMap((group) =>
        (group.items || []).map((item) => ({
          label: item.name,
          value: item.id,
          authority: item.authority,
          status: item.status,
          subjectName: item.subjectName,
          icon: item.icon,
          group: group.label
        }))
      )
    } finally {
      certificateLoading.value = false
    }
  }

  const certificateLabel = (id) => {
    if (id == null) return ''
    const found = certificateOptions.value.find((option) => option.value === id)
    if (found) return found.label
    if (id === 0) return 'Azion (SAN)'
    if (id === 1) return "Let's Encrypt (new)"
    if (id === 2) return "Let's Encrypt (reuse)"
    return `#${id}`
  }

  const domainList = computed(() => (Array.isArray(domains.value) ? domains.value : []))
  const hasMultipleDomains = computed(() => domainList.value.length > 1)

  const openCreateDrawer = () => {
    drawerMode.value = 'create'
    editingIndex.value = null
    drawerInitialData.value = {
      subdomain: '',
      domain: '',
      environment: null,
      useCustomDomain: useCustomDomain.value ?? false,
      customDomain: customDomain.value ?? '',
      certificate: 0
    }
    drawerVisible.value = true
  }

  const openEditDrawer = (index) => {
    drawerMode.value = 'edit'
    editingIndex.value = index
    const item = domains.value[index] || {}
    drawerInitialData.value = {
      subdomain: item.subdomain ?? '',
      domain: item.domain ?? '',
      environment: item.environment ?? null,
      useCustomDomain: useCustomDomain.value ?? false,
      customDomain: customDomain.value ?? '',
      certificate: item.certificate ?? 0
    }
    drawerVisible.value = true
  }

  const handleDrawerSave = (payload) => {
    setUseCustomDomain(payload.useCustomDomain)
    setCustomDomain(payload.customDomain ?? '')

    const domainPayload = {
      subdomain: payload.subdomain ?? '',
      domain: payload.domain ?? '',
      environment: payload.environment ?? null,
      certificate: payload.certificate ?? 0
    }

    if (drawerMode.value === 'edit' && editingIndex.value !== null) {
      const current = domains.value[editingIndex.value] || {}
      updateDomain(editingIndex.value, { ...current, ...domainPayload })
      if (editingIndex.value === 0) firstDomainTouched.value = true
    } else {
      pushDomain(domainPayload)
    }

    ensureEnvironmentInfo(domainPayload.environment)
  }

  const removeDomain = (index) => {
    if ((domains.value?.length || 0) <= 1) return
    remove(index)
  }

  const seedInitialDomain = async () => {
    if (props.isEdit) return
    if (
      (domains.value?.length || 0) > 0 &&
      domains.value.some((item) => item.domain || item.environment)
    ) {
      return
    }

    try {
      const { body } = await environmentService.listEnvironmentsService()
      const production = body?.find((env) => env.name === 'Production')

      if (production?.id != null) {
        environmentMap.value[production.id] = {
          name: production.name,
          deployment_version_policy: production.deployment_version_policy
        }
      }

      const seed = {
        subdomain: '',
        domain: buildAzionDomain(workloadName.value),
        environment: production?.id ?? null,
        certificate: 0
      }

      if ((domains.value?.length || 0) === 0) {
        pushDomain(seed)
      } else {
        const current = domains.value[0] || {}
        updateDomain(0, { ...current, ...seed })
      }
    } catch {
      // intentionally swallowed: seeding is non-blocking
    }
  }

  watch(workloadName, (newName) => {
    if (props.isEdit) return
    if (firstDomainTouched.value) return
    if (!domains.value?.length) return

    const current = domains.value[0] || {}
    updateDomain(0, { ...current, domain: buildAzionDomain(newName) })
  })

  watch(
    domains,
    async (rows) => {
      if (!Array.isArray(rows)) return
      for (const row of rows) {
        const envId = row?.environment ?? null
        if (envId) {
          await ensureEnvironmentInfo(envId)
        }
      }
    },
    { immediate: true, deep: true }
  )

  onMounted(() => {
    sugestionDomains()
    fetchCertificates()
    seedInitialDomain()
  })
</script>

<template>
  <form-horizontal
    title="Domains"
    description="Manage the domains linked to your application. Ensure proper DNS configuration by mapping CNAME records to the Workload domain. You can also use Edge DNS to simplify domain management and seamlessly link your domains to Azion."
    :isDrawer="props.isDrawer"
    :noBorder="props.noBorder"
  >
    <template #inputs>
      <div
        v-if="props.isEdit"
        class="flex gap-2 md:align-items-center max-sm:flex-col max-sm:align-items-top max-sm:gap-3"
      >
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <LabelBlock label="Workload Domain" />
          <span class="p-input-icon-right w-full flex max-w-lg flex-col items-start gap-2">
            <i class="pi pi-lock" />
            <InputText
              id="workloadHostname"
              data-testid="edit-domains-form__domain-field__input"
              v-model="workloadHostname"
              type="text"
              class="flex flex-col w-full"
              :feedback="false"
              disabled
            />
          </span>
          <small class="text-xs text-color-secondary font-normal leading-5">
            The default domain used to route traffic to your Workload.
          </small>
        </div>
        <copyBlock :value="workloadHostname" />
      </div>

      <div class="flex flex-col gap-3 max-w-3xl w-full">
        <CollapsibleCard
          title="Domain"
          :count="domainList.length"
          :defaultExpanded="true"
          dataTestid="domains-form__card"
        >
          <template
            v-for="(domain, index) in domainList"
            :key="index"
          >
            <DomainRow
              :domain="domain.domain"
              :subdomain="domain.subdomain"
              :environmentLabel="environmentName(domain.environment)"
              :certificateLabel="certificateLabel(domain.certificate)"
              :isUrlVersioned="isUrlVersionedEnv(domain.environment)"
              :disableRemove="!hasMultipleDomains"
              :dataTestid="`domains-form__row-${index}`"
              @edit="openEditDrawer(index)"
              @remove="removeDomain(index)"
            />
            <small
              v-if="props.isEdit && !domain.environment && (domain.subdomain || domain.domain)"
              class="p-error text-xs font-normal leading-tight px-4 pb-2"
            >
              This domain has no environment. Select one to keep routing consistent.
            </small>
          </template>

          <template #footer>
            <PrimeButton
              label="Add new Domain"
              icon="pi pi-plus"
              size="small"
              outlined
              data-testid="domains-form__add-domain-button"
              title="Add new Domain"
              @click="openCreateDrawer"
            />
          </template>
        </CollapsibleCard>

        <small
          v-if="domainsErrorMessage"
          class="p-error text-xs font-normal leading-tight"
        >
          {{ domainsErrorMessage }}
        </small>
      </div>

      <DomainDrawer
        v-model:visible="drawerVisible"
        :mode="drawerMode"
        :initialData="drawerInitialData"
        :domainsOptions="domainsOptions"
        :certificateOptions="certificateOptions"
        :certificateLoading="certificateLoading"
        :useHttps="!!useHttps"
        @save="handleDrawerSave"
        @certificateCreated="fetchCertificates"
      />
    </template>
  </form-horizontal>
</template>
