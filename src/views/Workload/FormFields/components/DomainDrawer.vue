<script setup>
  import { computed, ref, watch } from 'vue'
  import { useForm } from 'vee-validate'
  import * as yup from 'yup'
  import EmptyDrawer from '@/templates/empty-drawer'
  import ActionBarBlock from '@/templates/action-bar-block'
  import FieldDropdown from '@aziontech/webkit/field-dropdown'
  import FieldDropdownLazyLoader from '@aziontech/webkit/field-dropdown-lazy-loader'
  import RadioButton from '@aziontech/webkit/radiobutton'
  import MessageCard from '@/components/MessageCard'
  import PrimeButton from '@aziontech/webkit/button'
  import LabelBlock from '@aziontech/webkit/label'
  import DigitalCertificatesDrawer from '@/views/DigitalCertificates/Drawer/'
  import { environmentService } from '@/services/v2/environment/environment-service'

  defineOptions({ name: 'domain-drawer' })

  const DOMAIN_TYPE = { AZION: 'azion', OWN: 'own' }
  const AZION_APP_SUFFIX = '.azion.app'

  const stripAzionSuffix = (value) =>
    typeof value === 'string' && value.endsWith(AZION_APP_SUFFIX)
      ? value.slice(0, -AZION_APP_SUFFIX.length)
      : value || ''

  const inferDomainType = (data) => {
    if (data?.useCustomDomain) return DOMAIN_TYPE.AZION
    if (typeof data?.domain === 'string' && data.domain.endsWith(AZION_APP_SUFFIX)) {
      return DOMAIN_TYPE.AZION
    }
    if (data?.domain) return DOMAIN_TYPE.OWN
    return DOMAIN_TYPE.AZION
  }

  const buildInitialValues = (data) => {
    const type = inferDomainType(data)
    const rawDomain =
      type === DOMAIN_TYPE.AZION
        ? data?.customDomain || stripAzionSuffix(data?.domain)
        : data?.domain || ''
    return {
      domain: rawDomain,
      environment: data?.environment ?? null,
      domainType: type,
      certificate: data?.certificate ?? 0
    }
  }

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    mode: {
      type: String,
      default: 'create',
      validator: (value) => ['create', 'edit'].includes(value)
    },
    initialData: {
      type: Object,
      default: () => ({
        subdomain: '',
        domain: '',
        environment: null,
        useCustomDomain: false,
        customDomain: '',
        certificate: 0
      })
    },
    domainsOptions: {
      type: Array,
      default: () => []
    },
    certificateOptions: {
      type: Array,
      default: () => []
    },
    certificateLoading: {
      type: Boolean,
      default: false
    },
    useHttps: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['update:visible', 'save', 'cancel', 'certificateCreated'])

  const drawerSchema = yup.object({
    domain: yup
      .string()
      .required('Domain is required')
      .test('valid-domain', 'Invalid Domain format', (value) => {
        if (!value) return true
        if (value.endsWith('.')) return false
        const segments = value.split('.')
        if (segments.length > 11) return false
        return segments.every((segment) =>
          /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/.test(segment)
        )
      })
      .label('Domain'),
    environment: yup.string().required('Environment is required').label('Environment'),
    domainType: yup.string().oneOf([DOMAIN_TYPE.AZION, DOMAIN_TYPE.OWN]).required()
    // certificate: yup
    //   .mixed()
    //   .nullable()
    //   .test('cert-when-https', 'Digital Certificate is required', function (value) {
    //     if (!props.useHttps) return true
    //     return value !== undefined && value !== null && value !== 0
    //   })
    //   .label('Digital Certificate')
  })

  const { handleSubmit, resetForm, values, setFieldValue } = useForm({
    validationSchema: drawerSchema,
    initialValues: buildInitialValues(props.initialData)
  })

  watch(
    () => [props.visible, props.initialData],
    ([isVisible]) => {
      if (isVisible) {
        resetForm({ values: buildInitialValues(props.initialData) })
      }
    },
    { deep: true }
  )

  const visibleDrawer = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const title = computed(() => (props.mode === 'edit' ? 'Edit Domain' : 'Add Domain'))

  const isAzionDomain = computed(() => values.domainType === DOMAIN_TYPE.AZION)

  const dropdownPt = computed(() => ({
    trigger: {
      class: [
        'transition-all duration-200 ease-out overflow-hidden',
        isAzionDomain.value ? 'opacity-0 pointer-events-none !w-0' : 'opacity-100'
      ]
    },
    root: {
      class: [
        'transition-[border-radius] duration-200',
        isAzionDomain.value ? '!rounded-r-none' : ''
      ]
    },
    panel: {
      class: isAzionDomain.value ? '!hidden' : ''
    }
  }))

  const onDomainTypeChange = (value) => setFieldValue('domainType', value)

  const digitalCertificateDrawerRef = ref(null)
  const certificateStatus = ref('')

  const openCreateCertificateDrawer = () => {
    digitalCertificateDrawerRef.value?.changeCertificateType('edge_certificate')
    digitalCertificateDrawerRef.value?.openCreateDrawer()
  }

  const onCertificateCreated = ({ id }) => {
    setFieldValue('certificate', id)
    emit('certificateCreated', { id })
  }

  const onCertificateSelected = (option) => {
    certificateStatus.value = option?.status ?? ''
  }

  const certificateWarning = computed(() => {
    if (certificateStatus.value === 'pending') {
      return {
        text: 'This certificate is pending validation and HTTPS may not work until it’s validated',
        color: 'text-[var(--p-tag-warning-color)]'
      }
    }
    if (certificateStatus.value === 'failed') {
      return {
        text: 'This digital certificate failed and HTTPS cannot be used until the issue is resolved',
        color: 'text-[var(--error-color)]'
      }
    }
    return null
  })

  const onSave = handleSubmit((formValues) => {
    const isAzion = formValues.domainType === DOMAIN_TYPE.AZION
    const composedDomain = isAzion ? `${formValues.domain}${AZION_APP_SUFFIX}` : formValues.domain

    emit('save', {
      subdomain: '',
      domain: composedDomain,
      environment: formValues.environment ?? null,
      useCustomDomain: isAzion,
      customDomain: isAzion ? formValues.domain : '',
      certificate: formValues.certificate ?? 0
    })
    emit('update:visible', false)
  })

  const onCancel = () => {
    emit('cancel')
    emit('update:visible', false)
  }
</script>

<template>
  <EmptyDrawer
    v-model:visible="visibleDrawer"
    :title="title"
    width-class="max-w-2xl"
  >
    <template #content>
      <form
        class="w-full flex flex-col gap-6"
        @submit.prevent="onSave"
      >
        <div class="flex gap-3">
          <div class="flex items-start gap-3">
            <RadioButton
              inputId="domain-type-azion"
              name="domainType"
              :value="DOMAIN_TYPE.AZION"
              :modelValue="values.domainType"
              data-testid="domain-drawer__type-azion"
              @update:modelValue="onDomainTypeChange"
            />
            <label
              for="domain-type-azion"
              class="flex flex-col gap-1 cursor-pointer"
            >
              <span class="text-sm text-color">Get a free Azion Domain</span>
              <span class="text-xs text-color-secondary leading-tight">
                You can use a free azion.app domain.
              </span>
            </label>
          </div>

          <div class="flex items-start gap-3">
            <RadioButton
              inputId="domain-type-own"
              name="domainType"
              :value="DOMAIN_TYPE.OWN"
              :modelValue="values.domainType"
              data-testid="domain-drawer__type-own"
              @update:modelValue="onDomainTypeChange"
            />
            <label
              for="domain-type-own"
              class="flex flex-col gap-1 cursor-pointer"
            >
              <span class="text-sm text-color">Bring my own Domain</span>
              <span class="text-xs text-color-secondary leading-tight">
                Use my DNS to point traffic to this Workload.
              </span>
            </label>
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <LabelBlock
            label="Domain"
            name="domain"
            required
          />
          <div class="domain-drawer__domain-control flex items-stretch">
            <FieldDropdown
              name="domain"
              editable
              :options="isAzionDomain ? [] : domainsOptions"
              optionLabel="label"
              optionValue="label"
              placeholder="my-workload"
              emptyMessage="No DNS zones registered"
              :value="values.domain"
              :pt="dropdownPt"
              data-testid="domain-drawer__domain-field"
              class="flex-1 min-w-0"
            />
            <Transition name="tag">
              <PrimeButton
                v-if="isAzionDomain"
                label=".azion.app"
                size="small"
                class="domain-drawer__tag rounded-md rounded-l-none select-none focus:outline-none focus:ring-0"
                outlined
                tabindex="-1"
              />
            </Transition>
          </div>
        </div>
        <MessageCard
          v-if="isAzionDomain"
          type="info"
          description="Your workload is always accessible at a azion.app subdomain based on the workload name. Custom domains allow visitors to access your project at your own domains."
          data-testid="domain-drawer__azion-domain-info"
          class="max-w-xl"
        />

        <div class="flex flex-col gap-2">
          <LabelBlock
            label="Environments"
            name="environment"
            required
          />
          <FieldDropdownLazyLoader
            name="environment"
            :service="environmentService.listEnvironmentsServiceDropdown"
            :loadService="environmentService.loadEnvironmentService"
            optionLabel="name"
            optionValue="value"
            :value="values.environment"
            appendTo="self"
            placeholder="Select an option"
            data-testid="domain-drawer__environment-field"
          />
        </div>

        <div
          v-if="useHttps"
          class="flex flex-col gap-2"
        >
          <FieldDropdown
            data-testid="domain-drawer__certificate-field"
            label="Digital Certificate"
            name="certificate"
            :options="certificateOptions"
            :loading="certificateLoading"
            optionLabel="label"
            optionValue="value"
            :value="values.certificate"
            filter
            required
            placeholder="Select a certificate"
            appendTo="self"
            @onSelectOption="onCertificateSelected"
          >
            <template #footer>
              <ul class="p-2">
                <li>
                  <PrimeButton
                    class="w-full whitespace-nowrap flex"
                    text
                    size="small"
                    icon="pi pi-plus-circle"
                    data-testid="domain-drawer__create-digital-certificate-button"
                    :pt="{
                      label: { class: 'w-full text-left' },
                      root: { class: 'p-2' }
                    }"
                    label="Create Digital Certificate"
                    @click="openCreateCertificateDrawer"
                  />
                </li>
              </ul>
            </template>
          </FieldDropdown>
          <small
            v-if="certificateWarning"
            :class="certificateWarning.color"
            class="text-xs font-normal"
            data-testid="domain-drawer__certificate-warning"
          >
            {{ certificateWarning.text }}
          </small>
        </div>

        <DigitalCertificatesDrawer
          ref="digitalCertificateDrawerRef"
          isWorkloadCreation
          @onSuccess="onCertificateCreated"
        />
      </form>
    </template>

    <template #footer>
      <ActionBarBlock
        :inDrawer="true"
        primaryActionLabel="Save"
        @onSubmit="onSave"
        @onCancel="onCancel"
      />
    </template>
  </EmptyDrawer>
</template>

<style scoped>
  .domain-drawer__domain-control {
    min-height: 2.5rem;
  }

  .domain-drawer__tag {
    flex-shrink: 0;
  }

  .tag-enter-active,
  .tag-leave-active {
    transition:
      opacity 180ms ease-out,
      transform 180ms ease-out;
    transform-origin: left center;
  }

  .tag-enter-from,
  .tag-leave-to {
    opacity: 0;
    transform: scale(0.9);
  }
</style>
