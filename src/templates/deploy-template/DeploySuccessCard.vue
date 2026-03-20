<script setup>
  import { computed, ref, onMounted } from 'vue'
  import { useForm, useField, useFieldArray } from 'vee-validate'
  import * as yup from 'yup'
  import Accordion from 'primevue/accordion'
  import AccordionTab from 'primevue/accordiontab'
  import PrimeButton from 'primevue/button'
  import { useRouter } from 'vue-router'

  import BaseDeployCard from './BaseDeployCard.vue'
  import ResourcesCreatedBlock from './ResourcesCreatedBlock.vue'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown.vue'
  import LabelBlock from '@/templates/label-block'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock.vue'
  import FieldInputGroup from '@/templates/form-fields-inputs/fieldInputGroup.vue'
  import { edgeDNSService } from '@/services/v2/edge-dns/edge-dns-service'

  const props = defineProps({
    // Status message
    appUrl: {
      type: String,
      required: true
    },

    // Preview block for resources created
    previewSrc: {
      type: String,
      default: ''
    },
    previewAlt: {
      type: String,
      default: ''
    },

    // Resources created block
    resources: {
      type: Array,
      default: () => []
      // Expected format: [{ type: 'workload' | 'application' | 'function' | 'firewall', name: 'string' }]
    }
  })

  const emit = defineEmits(['onSave'])
  const router = useRouter()
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
  const { handleSubmit } = useForm({
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
   */
  const { errorMessage: domainsErrorMessage, value: domains } = useField('domains')
  const { fields: domainsList, push: pushDomain, remove } = useFieldArray('domains')
  const { value: useCustomDomain } = useField('useCustomDomain')
  const { value: customDomain, errorMessage: customDomainErrorMessage } = useField('customDomain')

  const domainsOptions = ref([])

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

  const openMetrics = () => {
    router.push('/real-time-metrics')
  }

  const nextSteps = [
    {
      action: () => openMetrics(),
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
   * Handle form submission
   * Called when validation passes
   */
  const onSubmit = handleSubmit((values) => {
    emit('onSave', values)
  })

  // Load domain suggestions on mount
  onMounted(() => {
    sugestionDomains()
  })
</script>

<template>
  <BaseDeployCard
    title="Deployment Successful"
  >
    <template #content>
      <p class="text-sm text-color-secondary leading-5">
        Your application is being distributed, in few minutes, the application will be available on
        <a
          :href="props.appUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary hover:text-primary-hover transition-colors inline-flex items-center gap-1"
        >
          <span class="underline">{{ appUrlDisplay }}</span>
          <i class="pi pi-external-link text-[10px]" /> </a
        >.
      </p>

      <ResourcesCreatedBlock
        :preview-src="props.previewSrc"
        :preview-alt="props.previewAlt"
        :resources="props.resources"
      />

      <div class="flex flex-col gap-3">
        <span class="text-sm font-semibold text-color">Additional Settings</span>
        <Accordion>
          <AccordionTab
            :pt="{
              header: { class: 'bg-neutral-950' },
              headerAction: { class: 'bg-neutral-950 hover:bg-neutral-900 focus:shadow-none' },
              content: { class: '!p-0 ' }
            }"
          >
            <template #header>
              <div class="flex items-center gap-2">
                <i class="pi pi-globe" />
                <span>Customize Domain</span>
              </div>
            </template>
            <div class="flex flex-col gap-4 p-4">
              <div class="flex flex-col gap-2">
                <LabelBlock label="Domain" />
                <div
                  v-for="(domain, index) in domains"
                  :key="index"
                  class="flex gap-2 items-start w-full"
                >
                  <div class="flex flex-col sm:max-w-lg w-full gap-2">
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
                      :class="{ 'p-invalid': domainsErrorMessage }"
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
                    @click="removeDomain(index)"
                    icon="pi pi-trash"
                    class="p-button-outlined p-button-sm p-button-danger"
                    data-testid="domains-form__remove-domain-button"
                    title="Remove domain"
                  />
                </div>

                <small
                  v-if="domainsErrorMessage"
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
                class="flex sm:max-w-lg w-full gap-2 flex-col sm:flex-row"
                :class="{ 'items-center': customDomainErrorMessage }"
              >
                <div class="flex flex-col sm:max-w-lg w-full gap-2">
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
            </div>
            <div class="bg-neutral-950 h-16 p-4 flex justify-end rounded-b-md">
              <PrimeButton
                severity="primary"
                label="Save"
                @click="onSubmit"
                icon-pos="right"
                class="max-md:w-full md:min-w-[5rem]"
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
            class="h-11 rounded-md border surface-border bg-neutral-950 flex items-center px-3 cursor-pointer hover:border-primary transition-colors"
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
      <PrimeButton
        severity="secondary"
        label="Continue to Home"
        @click="router.push('/')"
        icon-pos="right"
        class="max-md:w-full md:min-w-[5rem]"
      />
    </template>
  </BaseDeployCard>
</template>
