<script setup>
  import { computed, ref } from 'vue'
  import { useField } from 'vee-validate'
  import Accordion from 'primevue/accordion'
  import AccordionTab from 'primevue/accordiontab'
  import PrimeButton from 'primevue/button'

  import BaseDeployCard from './BaseDeployCard.vue'
  import TemplateInfoBlock from './TemplateInfoBlock.vue'
  import FieldText from '@/templates/form-fields-inputs/fieldText.vue'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock.vue'

  const props = defineProps({
    // Status message
    appUrl: {
      type: String,
      required: true
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
      required: true
    },
    templateDescription: {
      type: String,
      default: ''
    },
    githubUrl: {
      type: String,
      default: ''
    }
  })

  /**
   * Dynamic domain list state
   * Each domain has a unique id and value
   */
  const domains = ref([{ id: crypto.randomUUID(), value: '' }])

  /**
   * Add a new domain field to the list
   */
  const addDomain = () => {
    domains.value.push({ id: crypto.randomUUID(), value: '' })
  }

  /**
   * Remove a domain field from the list
   * Minimum 1 field is always kept
   */
  const removeDomain = (id) => {
    if (domains.value.length === 1) return
    domains.value = domains.value.filter((domain) => domain.id !== id)
  }

  /**
   * Build dynamic validation schema based on current domains
   */
  // const buildValidationSchema = () => {
  //   const schema = {}

  //   // Add validation for each domain field
  //   // eslint-disable-next-line id-length
  //   domains.value.forEach((_, index) => {
  //     schema[`domain_${index}`] = yup.string()
  //   })

  //   // Add validation for other fields
  //   schema.use_azion_domain = yup.boolean().default(false)
  //   schema.custom_domain = yup.string().when('use_azion_domain', {
  //     is: true,
  //     then: (schema) => schema.required('Custom domain is required when using Azion domain')
  //   })
  //   schema.workload_domain_allow_access = yup.boolean().default(false)

  //   return schema
  // }

  /**
   * vee-validate form setup
   */
  // const { handleSubmit, values } = useForm({
  //   validationSchema: buildValidationSchema()
  // })

  /**
   * Track use_azion_domain switch state for conditional rendering
   */
  const { value: useAzionDomain } = useField('use_azion_domain', undefined, {
    initialValue: false
  })

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

  const nextSteps = [
    {
      action: () => window.open(props.appUrl, '_blank', 'noopener,noreferrer'),
      icon: 'pi-chart-line',
      label: 'View Real-Time Metrics'
    },
    {
      action: () => window.open(props.appUrl, '_blank', 'noopener,noreferrer'),
      icon: 'pi-shopping-cart',
      label: 'Explore Functions from Marketplace'
    }
  ]
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
          class="text-primary hover:text-primary-hover transition-colors inline-flex items-center gap-1"
        >
          <span class="underline">{{ appUrlDisplay }}</span>
          <i class="pi pi-external-link text-[10px]" /> </a
        >.
      </p>

      <TemplateInfoBlock
        :preview-src="props.previewSrc"
        :preview-alt="props.previewAlt"
        :template-title="props.templateTitle"
        :template-url="props.templateUrl"
        :template-description="props.templateDescription"
        :github-url="props.githubUrl"
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
                <div
                  v-for="(domain, index) in domains"
                  :key="domain.id"
                  class="flex w-full gap-2 justify-between"
                >
                  <div class="flex flex-col gap-2 w-full">
                    <div class="flex flex-col sm:max-w-lg w-full gap-2">
                      <FieldText
                        label="Domain"
                        name="domain"
                        :value="domain"
                        placeholder="example.com"
                        description="Type your domain or select from Edge DNS."
                      />
                    </div>
                  </div>
                  <button
                    v-if="index"
                    type="button"
                    @click="removeDomain(domain.id)"
                    class="mt-7 p-2 text-color-secondary rounded-md"
                    aria-label="Remove domain"
                  >
                    <i class="pi pi-trash" />
                  </button>
                </div>

                <PrimeButton
                  label="Add Domain"
                  icon="pi pi-plus"
                  severity="secondary"
                  class="w-1/3"
                  @click="addDomain"
                />
              </div>

              <FieldSwitchBlock
                name="use_azion_domain"
                nameField="use_azion_domain"
                title="Custom Domain"
                subtitle="You can use a free azion.app domain."
                :isCard="false"
              />

              <FieldText
                v-if="useAzionDomain"
                name="custom_domain"
                label="Custom Domain"
              />

              <!-- Workload Domain Allow Access Switch -->
              <FieldSwitchBlock
                nameField="workload_domain_allow_access"
                name="workload_domain_allow_access"
                title="Workload Domain Allow Access"
                subtitle="Allow direct access to the default workload domain generated after workload creation (*.map.azionedge.net)."
                :isCard="false"
              />
            </div>
            <div class="bg-neutral-950 h-16 p-4 flex justify-end">
              <PrimeButton
                severity="primary"
                label="Save"
                @click="handleSubmit"
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
      <slot name="footer"> </slot>
    </template>
  </BaseDeployCard>
</template>
