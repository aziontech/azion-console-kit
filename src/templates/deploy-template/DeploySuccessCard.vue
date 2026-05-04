<script setup>
  import { computed, ref, onMounted, watch } from 'vue'
  import { useForm, useField, useFieldArray } from 'vee-validate'
  import * as yup from 'yup'
  import Accordion from 'primevue/accordion'
  import AccordionTab from 'primevue/accordiontab'
  import PrimeButton from 'primevue/button'
  import { useRouter } from 'vue-router'

  import BaseDeployCard from './BaseDeployCard.vue'
  import TemplateInfoBlock from './TemplateInfoBlock.vue'
  import FieldDropdown from '@aziontech/webkit/field-dropdown'
  import LabelBlock from '@aziontech/webkit/label'
  import FieldSwitchBlock from '@aziontech/webkit/field-switch-block'
  import FieldInputGroup from '@aziontech/webkit/field-input-group'
  import { edgeDNSService } from '@/services/v2/edge-dns/edge-dns-service'
  import { workloadService } from '@/services/v2/workload/workload-service'
  import { hasFlagBlockApiV4 } from '@/composables/user-flag'

  const props = defineProps({
    // Status message
    appUrl: {
      type: String,
      required: true
    },

    // Execution ID for viewing logs
    executionId: {
      type: String,
      default: ''
    },

    // Preview block — same pattern as DeployRepositoryCard
    previewSrc: {
      type: String,
      default: ''
    },
    previewAlt: {
      type: String,
      default: ''
    },

    // Info block
    templateTitle: {
      type: String,
      required: true
    },
    templateUrl: {
      type: String,
      default: ''
    },
    templateDescription: {
      type: String,
      default: ''
    },
    githubUrl: {
      type: String,
      default: ''
    },

    // Deployment results
    results: {
      type: Object,
      default: null
    },

    // Workload ID for loading existing domain data
    workloadId: {
      type: [String, Number],
      default: null
    },

    // Loading state for save operation
    isSaving: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['onSave'])
  const router = useRouter()

  /**
   * Build resources array from deployment results
   */
  const resourcesCreated = computed(() => {
    if (!props.results) return []

    const resources = []

    // Add Workload (domain)
    if (props.results.domain?.url) {
      resources.push({
        type: `${hasFlagBlockApiV4() ? 'Domain' : 'Workloads'}`,
        redirect: () =>
          router.push({
            name: `${hasFlagBlockApiV4() ? 'edit-domain' : 'edit-workload'}`,
            params: { id: props.results.domain.id }
          }),
        name: props.results.edgeApplication?.name || 'Workload',
        icon: 'ai ai-workloads'
      })
    }

    // Add Edge Application
    if (props.results.edgeApplication?.name) {
      resources.push({
        type: 'Application',
        redirect: () =>
          router.push({
            name: 'edit-application',
            params: { id: props.results.edgeApplication.id }
          }),
        name: props.results.edgeApplication.name,
        icon: 'ai ai-edge-application'
      })
    }

    // Add Function (if exists in extras)
    if (props.results.extras?.functionName) {
      resources.push({
        type: 'Function',
        redirect: () =>
          router.push({ name: 'edit-functions', params: { id: props.results.extras.functionId } }),
        name: props.results.extras.functionName,
        icon: 'ai ai-edge-functions'
      })
    }

    // Add Firewall (if exists in extras)
    if (props.results.extras?.firewallName) {
      resources.push({
        type: 'Firewall',
        redirect: () =>
          router.push({ name: 'edit-firewall', params: { id: props.results.extras.firewallId } }),
        name: props.results.extras.firewallName,
        icon: 'ai ai-edge-functions'
      })
    }

    return resources
  })

  /**
   * Validation schema for the form
   * When useCustomDomain is true:
   * - customDomain is required
   * - domains must have at least one item with a value
   */
  const validationSchema = yup.object({
    domains: yup
      .array()
      .min(1, 'At least one domain is required')
      .test(
        'has-valid-domain',
        'At least one domain must be filled',
        (value) => value && value.some((item) => item.domain && item.domain.trim() !== '')
      ),
    useCustomDomain: yup.boolean(),
    customDomain: yup.string().when('useCustomDomain', {
      is: true,
      then: (schema) => schema.required('Custom domain is required when using custom domain')
    }),
    workloadHostnameAllowAccess: yup.boolean()
  })

  /**
   * vee-validate form setup with validation schema and initial values
   */
  const { handleSubmit, setValues } = useForm({
    validationSchema,
    initialValues: {
      domains: [{ domain: '' }],
      useCustomDomain: false,
      customDomain: '',
      workloadHostnameAllowAccess: false
    }
  })

  /**
   * vee-validate form fields setup
   * meta is used to track if the field has been touched (user interacted with it)
   * to prevent showing validation errors before user interaction
   */
  const {
    errorMessage: domainsErrorMessage,
    value: domains,
    meta: domainsMeta
  } = useField('domains')
  const { fields: domainsList, push: pushDomain, remove } = useFieldArray('domains')
  const { value: useCustomDomain } = useField('useCustomDomain')
  const { value: customDomain } = useField('customDomain')

  const domainsOptions = ref([])
  const isLoadingWorkload = ref(false)

  /**
   * Add a new domain field to the list
   */
  const addNewDomain = () => {
    pushDomain({ domain: '' })
  }

  /**
   * Remove a domain field from the list
   * Minimum 1 field is always kept
   */
  const removeDomain = (domainId) => {
    if (domainsList.value.length > 1) {
      remove(domainId)
    }
  }

  /**
   * Load Edge DNS domains for dropdown suggestions
   */
  const sugestionDomains = async () => {
    const domains = await edgeDNSService.listEdgeDNSService({
      fields: ['id', 'domain'],
      active: 'True'
    })
    domainsOptions.value = domains.body.map((domain) => {
      return {
        label: domain.domain.content,
        value: domain.id
      }
    })
  }

  /**
   * Update domain value
   */
  const updateDomainValue = (index, value) => {
    const domain = domainsList.value[index]
    if (domain) {
      domain.domain = value
    }
  }

  /**
   * Check if there are multiple domains
   */
  const hasMultipleDomains = computed(() => domainsList.value.length !== 1)

  /**
   * Extract domain from appUrl for display
   */
  const appUrlDisplay = computed(() => {
    try {
      const url = new URL(props.appUrl)
      return url.host + url.pathname
    } catch {
      return props.appUrl
    }
  })

  /**
   * Handle click on next step item
   */
  const handleStepClick = (step) => {
    if (step.action) {
      step.action()
    } else if (step.href) {
      window.open(step.href, '_blank', 'noopener,noreferrer')
    }
  }

  const openMarketplace = () => {
    router.push('/marketplace')
  }

  const openRealTimeEvents = () => {
    if (props.executionId) {
      router.push({
        name: 'real-time-events'
      })
    }
  }

  const nextSteps = [
    {
      action: () => openRealTimeEvents(),
      icon: 'pi-chart-line',
      label: 'View Real-Time Metrics'
    },
    {
      action: () => openMarketplace(),
      icon: 'pi-shopping-cart',
      label: 'Explore Functions from Marketplace'
    }
  ]

  /**
   * Computed loading icon for save button
   */
  const saveButtonIcon = computed(() => {
    return props.isSaving ? 'pi pi-spin pi-spinner' : ''
  })

  /**
   * Handle form submission
   * Called when validation passes
   */
  const onSubmit = handleSubmit((values) => {
    emit('onSave', values)
  })

  /**
   * Load workload data and populate form fields
   */
  const loadWorkloadData = async () => {
    if (!props.workloadId) return

    isLoadingWorkload.value = true
    try {
      const workload = await workloadService.loadWorkload({ id: props.workloadId })
      // Transform domains from { subdomain, domain } to { domain: 'full.domain' }
      const loadedDomains = workload.domains
        .filter((domainItem) => domainItem.domain)
        .map((domainItem) => ({
          domain: domainItem.subdomain
            ? `${domainItem.subdomain}.${domainItem.domain}`
            : domainItem.domain
        }))

      // Ensure at least one domain field exists
      if (loadedDomains.length === 0) {
        loadedDomains.push({ domain: '' })
      }

      setValues({
        domains: loadedDomains,
        useCustomDomain: workload.useCustomDomain || false,
        customDomain: workload.customDomain || '',
        workloadHostnameAllowAccess: workload.workloadHostnameAllowAccess || false
      })
    } catch (error) {
      // Silently fail - form will use default empty values
    } finally {
      isLoadingWorkload.value = false
    }
  }

  // Load domain suggestions on mount
  onMounted(async () => {
    await sugestionDomains()
  })

  // Watch for workloadId changes to load existing domain data
  watch(
    () => props.workloadId,
    (newWorkloadId) => {
      if (newWorkloadId) {
        loadWorkloadData()
      }
    },
    { immediate: false }
  )
</script>

<template>
  <BaseDeployCard
    title="Deployment Successful"
    :hide-footer="true"
  >
    <template #content>
      <p class="text-sm text-color-secondary leading-5">
        Your application is being distributed, in few minutes, the application will be available on

        <a
          :href="props.appUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="text-[var(--text-color-link)] text-xs inline-flex items-center gap-1"
        >
          <span class="hover:underline">{{ appUrlDisplay }}</span>
          <i class="pi pi-external-link text-xs !no-underline" />
        </a>
      </p>

      <TemplateInfoBlock
        :preview-src="props.previewSrc"
        :preview-alt="props.previewAlt"
        :resources="resourcesCreated"
        resources-only
      />

      <div class="flex flex-col gap-3">
        <span class="text-sm font-semibold text-color">Additional Settings</span>
        <Accordion>
          <AccordionTab
            :pt="{
              header: { class: 'bg-[var(--surface-ground)]' },
              headerAction: {
                class: 'bg-[var(--surface-ground)] hover:opacity-100 focus:shadow-none'
              },
              content: { class: '!p-0 bg-[var(--surface-section)]' }
            }"
          >
            <template #header>
              <div class="flex items-center gap-2">
                <i class="pi pi-globe" />
                <span>Customize Domain</span>
              </div>
            </template>
            <div class="flex flex-col gap-4 p-4">
              <div
                v-if="isLoadingWorkload"
                class="flex items-center justify-center py-4"
              >
                <i class="pi pi-spin pi-spinner text-2xl text-primary" />
              </div>
              <template v-else>
                <div class="flex flex-col gap-2">
                  <LabelBlock label="Domain" />
                  <div
                    v-for="(domain, index) in domains"
                    :key="index"
                    class="flex flex-col sm:flex-row gap-2 w-full"
                  >
                    <div class="flex flex-col w-full gap-2">
                      <FieldDropdown
                        editable
                        :focusOnHover="false"
                        :name="`domains[${index}].domain`"
                        :options="domainsOptions"
                        optionLabel="label"
                        optionValue="label"
                        placeholder="example.com"
                        emptyMessage="No domains available"
                        :value="domain.domain"
                        :class="{ 'p-invalid': domainsErrorMessage && domainsMeta.touched }"
                        @change="updateDomainValue(index, $event.value)"
                        data-testid="domains-form__domain-dropdown"
                      />
                      <small
                        class="text-xs text-color-secondary font-normal leading-5 -mt-1"
                        v-if="!index"
                      >
                        Type your domain or select from Edge DNS.
                      </small>
                    </div>

                    <PrimeButton
                      v-if="hasMultipleDomains"
                      :class="{ 'mb-6': !index }"
                      @click="removeDomain(index)"
                      icon="pi pi-trash"
                      class="p-button-outlined p-button-sm p-button-danger self-end"
                      data-testid="domains-form__remove-domain-button"
                      title="Remove domain"
                    />
                  </div>

                  <small
                    v-if="domainsErrorMessage && domainsMeta.touched"
                    class="p-error text-xs font-normal leading-tight"
                  >
                    {{ domainsErrorMessage }}
                  </small>
                </div>

                <div class="flex mt-1">
                  <PrimeButton
                    @click="addNewDomain"
                    label="Add Another"
                    icon="pi pi-plus-circle"
                    outlined
                    size="small"
                    data-testid="domains-form__add-domain-button"
                    title="Add Another"
                  />
                </div>

                <FieldSwitchBlock
                  nameField="useCustomDomain"
                  name="useCustomDomain"
                  auto
                  title="Custom Domain"
                  subtitle="You can use an free azion.app domain."
                  :isCard="false"
                />

                <div
                  v-if="useCustomDomain"
                  class="flex w-full gap-2 flex-col"
                >
                  <div class="flex flex-col w-full gap-2">
                    <FieldInputGroup
                      placeholder="my-custom-name"
                      label="Azion Custom Domain"
                      required
                      :value="customDomain"
                      name="customDomain"
                      data-testid="workload-custom-domain-field"
                    >
                      <template #button>
                        <PrimeButton
                          label=".azion.app"
                          size="small"
                          class="rounded-md rounded-l-none select-none focus:outline-none focus:ring-0"
                          outlined
                        />
                      </template>
                    </FieldInputGroup>
                  </div>
                </div>

                <FieldSwitchBlock
                  nameField="workloadHostnameAllowAccess"
                  name="workloadHostnameAllowAccess"
                  auto
                  title="Workload Domain Allow Access"
                  subtitle="Allow direct access to the default Workload domain generated after Workload creation (e.g id.map.azionedge.net)."
                  :isCard="false"
                />
              </template>
            </div>
            <div class="bg-[var(--surface-ground)] h-16 p-4 flex justify-end rounded-b-md">
              <PrimeButton
                severity="primary"
                label="Save"
                @click="onSubmit"
                icon-pos="right"
                class="max-md:w-full md:min-w-[5rem]"
                :icon="saveButtonIcon"
                :disabled="isSaving"
              />
            </div>
          </AccordionTab>
        </Accordion>
      </div>

      <div
        v-if="nextSteps.length > 0"
        class="flex flex-col gap-3"
      >
        <span class="text-sm font-semibold text-color">Next Steps</span>
        <div class="flex flex-col gap-2">
          <div
            v-for="(step, index) in nextSteps"
            :key="index"
            class="h-11 rounded-md border surface-border bg-[var(--surface-ground)] flex items-center px-3 cursor-pointer hover:border-surface transition-colors"
            @click="handleStepClick(step)"
          >
            <div
              class="p-1.5 bg-[var(--surface-100)] rounded mr-3 flex items-center justify-center"
            >
              <i
                v-if="step.icon && step.icon.startsWith('pi-')"
                :class="['pi', step.icon, 'w-3.5 h-3.5 text-color']"
              />
              <img
                v-else-if="step.icon"
                :src="step.icon"
                :alt="step.label"
                class="w-3.5 h-3.5"
              />
            </div>

            <span class="flex-1 text-xs font-semibold font-['Sora'] leading-7 text-color">
              {{ step.label }}
            </span>

            <div
              class="w-8 h-8 rounded-md flex items-center justify-center hover:bg-[var(--surface-100)] transition-colors"
            >
              <i class="pi pi-chevron-right w-3.5 h-3.5 text-color-secondary" />
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <slot name="footer"> </slot>
    </template>
  </BaseDeployCard>
</template>
