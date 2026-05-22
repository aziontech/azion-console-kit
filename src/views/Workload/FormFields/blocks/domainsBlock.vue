<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@aziontech/webkit/field-text'
  import InputText from '@aziontech/webkit/inputtext'
  import LabelBlock from '@aziontech/webkit/label'
  import FieldDropdown from '@aziontech/webkit/field-dropdown'
  import FieldDropdownLazyLoader from '@aziontech/webkit/field-dropdown-lazy-loader'
  import FieldSwitchBlock from '@aziontech/webkit/field-switch-block'
  import FieldInputGroup from '@aziontech/webkit/field-input-group'
  import CopyBlock from '@aziontech/webkit/button-copy'
  import PrimeTag from '@aziontech/webkit/tag'

  import PrimeButton from '@aziontech/webkit/button'
  import { useFieldArray, useField } from 'vee-validate'
  import { ref, watch, computed } from 'vue'
  import { edgeDNSService } from '@/services/v2/edge-dns/edge-dns-service'
  import { environmentService } from '@/services/v2/environment/environment-service'

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
  const { fields: domainsList, push: pushDomain, remove } = useFieldArray('domains')
  const { value: workloadHostname } = useField('workloadHostname')
  const { value: useCustomDomain } = useField('useCustomDomain')
  // eslint-disable-next-line no-unused-vars
  const { value: customDomain, errorMessage: customDomainErrorMessage } = useField('customDomain')
  const { value: tls } = useField('tls')

  const { setValue: setCommonName } = useField('letEncrypt.commonName')
  const { setValue: setAlternativeNames } = useField('letEncrypt.alternativeNames')
  const domainsOptions = ref([])
  const environmentPolicies = ref({})

  const addNewDomain = () => {
    pushDomain({
      subdomain: '',
      domain: '',
      environment: null
    })
  }

  const listEnvironmentsDecorator = async (queryParams) => {
    const response = await environmentService.listEnvironmentsServiceDropdown({
      ...queryParams,
      fields: ['id', 'name', 'deployment_version_policy']
    })

    response.body.forEach((env) => {
      if (env?.id != null) {
        environmentPolicies.value[env.id] = env.deployment_version_policy
      }
    })

    return response
  }

  const ensureEnvironmentPolicy = async (envId) => {
    if (!envId || environmentPolicies.value[envId]) return
    try {
      const env = await environmentService.loadEnvironmentService({ id: envId })
      if (env?.id != null) {
        environmentPolicies.value[env.id] = env.deployment_version_policy
      }
    } catch {
      // intentionally swallowed: policy tag is non-blocking UX
    }
  }

  const onEnvironmentSelected = (index, value) => {
    const envId = value?.value ?? value
    ensureEnvironmentPolicy(envId)
  }

  const policyTag = (envId) => {
    const policy = environmentPolicies.value[envId]
    if (!policy) return null
    if (policy === 'single_version') {
      return { value: 'Single Version', severity: 'info', icon: 'pi pi-lock' }
    }
    return { value: 'Versioned URLs', severity: 'warn', icon: 'pi pi-sitemap' }
  }

  const removeDomain = (domainId) => {
    if (domainsList.value.length > 1) {
      remove(domainId)
    }
    handleLetEncrypt()
  }

  const sugestionDomains = async () => {
    const domains = await edgeDNSService.listEdgeDNSService({
      fields: ['id', 'domain'],
      active: 'True' //To-Do: replace with true (boolean type) once API is fixed
    })
    domainsOptions.value = domains.body.map((domain) => {
      return {
        label: domain.domain.content,
        value: domain.id
      }
    })
  }

  const updateDomainSubdomain = (domainId, value) => {
    const domain = domainsList.value[domainId]
    if (domain) {
      domain.subdomain = value
    }
  }

  const updateDomainType = (index, value) => {
    const domain = domainsList.value[index]
    if (domain) {
      domain.domain = value
    }
  }

  const hasMultipleDomains = computed(() => domainsList.value.length !== 1)

  const checkHasDomain = () => {
    let hasDomain = false
    domains.value.forEach((domain) => {
      if (domain.domain) {
        hasDomain = true
      }
    })

    if (hasDomain && tls.value.certificate === 0) {
      tls.value.certificate = 1
    }
  }
  const handleLetEncrypt = () => {
    if (!domains.value?.length) return

    const [first, ...rest] = domains.value

    const commonName = `${first.subdomain ? `${first.subdomain}.` : ''}${first.domain}`
    const alternativeNames = rest
      .map(({ subdomain, domain }) => `${subdomain ? `${subdomain}.` : ''}${domain}`)
      .filter((name) => name.trim() !== '.')

    alternativeNames.filter((name) => name !== '')
    setAlternativeNames(alternativeNames)
    setCommonName(commonName)
    checkHasDomain()
  }

  sugestionDomains()

  watch(
    domainsList,
    async (rows) => {
      if (!Array.isArray(rows)) return
      for (const row of rows) {
        const envId = row?.value?.environment ?? row?.environment ?? null
        if (envId) {
          await ensureEnvironmentPolicy(envId)
        }
      }
    },
    { immediate: true, deep: false }
  )
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
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-2 max-sm:gap-6">
          <div class="flex max-w-3xl gap-2 w-full max-sm:hidden">
            <div class="flex flex-1">
              <LabelBlock label="Subdomain" />
            </div>
            <div class="flex flex-1">
              <LabelBlock
                label="Domain"
                name="domains"
              />
            </div>
            <div class="flex flex-1">
              <LabelBlock label="Environment" />
            </div>
          </div>
          <div
            v-for="(domain, index) in domains"
            :key="index"
            class="flex flex-col gap-2"
          >
            <div
              class="flex gap-4 md:align-items-center max-sm:flex-col max-sm:align-items-top max-sm:gap-3 items-start"
            >
              <div class="flex flex-col sm:flex-row sm:max-w-3xl w-full gap-2">
                <div class="flex flex-col w-full gap-2 sm:flex-1">
                  <LabelBlock
                    class="sm:hidden"
                    label="Subdomain"
                  />
                  <FieldText
                    :name="`domains[${index}].subdomain`"
                    :class="{ 'p-invalid': domainsErrorMessage }"
                    :value="domain.subdomain"
                    @blur="handleLetEncrypt"
                    @input="updateDomainSubdomain(index, $event)"
                    data-testid="domains-form__subdomain-field"
                  />
                </div>

                <div class="flex flex-col w-full gap-2 sm:flex-1">
                  <LabelBlock
                    class="sm:hidden"
                    label="Domain"
                  />
                  <FieldDropdown
                    editable
                    :focusOnHover="false"
                    :name="`domains[${index}].domain`"
                    :options="domainsOptions"
                    optionLabel="label"
                    optionValue="label"
                    placeholder="example.net"
                    emptyMessage="No domains available"
                    :value="domain.domain"
                    @blur="handleLetEncrypt"
                    :class="{ 'p-invalid': domainsErrorMessage }"
                    @change="updateDomainType(index, $event.value)"
                    data-testid="domains-form__domain-dropdown"
                  />
                </div>

                <div class="flex flex-col w-full gap-2 sm:flex-1">
                  <LabelBlock
                    class="sm:hidden"
                    label="Environment"
                  />
                  <FieldDropdownLazyLoader
                    :name="`domains[${index}].environment`"
                    :service="listEnvironmentsDecorator"
                    :loadService="environmentService.loadEnvironmentService"
                    optionLabel="name"
                    optionValue="value"
                    :value="domain.environment"
                    appendTo="self"
                    placeholder="Select an environment"
                    @change="onEnvironmentSelected(index, $event)"
                    :data-testid="`domains-form__environment-dropdown-${index}`"
                  />
                </div>
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

            <div
              v-if="
                policyTag(domain.environment) ||
                (props.isEdit && !domain.environment && (domain.subdomain || domain.domain))
              "
              class="flex max-w-3xl w-full"
            >
              <PrimeTag
                v-if="policyTag(domain.environment)"
                v-bind="policyTag(domain.environment)"
                class="self-start"
              />
              <small
                v-if="props.isEdit && !domain.environment && (domain.subdomain || domain.domain)"
                class="p-error text-xs font-normal leading-tight"
              >
                This domain has no environment. Select one to keep routing consistent.
              </small>
            </div>
          </div>
          <div class="max-w-3xl">
            <small
              v-if="domainsErrorMessage"
              class="p-error text-xs font-normal leading-tight"
            >
              {{ domainsErrorMessage }}
            </small>
          </div>
          <div class="flex max-w-3xl gap-2 w-full max-sm:hidden">
            <div class="flex flex-1">
              <small class="text-xs text-color-secondary font-normal leading-5">
                (e.g., www, app, leave blank for root)
              </small>
            </div>
            <div class="flex flex-1">
              <small class="text-xs text-color-secondary font-normal leading-5">
                Type your domain or select from Edge DNS.
              </small>
            </div>
            <div class="flex flex-1">
              <small class="text-xs text-color-secondary font-normal leading-5">
                The environment routing this domain.
              </small>
            </div>
          </div>
        </div>
        <div class="flex mt-1">
          <PrimeButton
            @click="addNewDomain"
            label="Add Domain"
            icon="pi pi-plus-circle"
            outlined
            size="small"
            data-testid="domains-form__add-domain-button"
            title="Add Domain"
          />
        </div>
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldSwitchBlock
          data-testid="domains-form__custom-domain-field"
          nameField="useCustomDomain"
          name="useCustomDomain"
          :disabled="disabledCustomDomain"
          auto
          :isCard="false"
          title="Custom Domain"
          subtitle="You can use an free azion.app domain."
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
      </div>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldSwitchBlock
          data-testid="domains-form__workload-domain-allow-access-field"
          nameField="workloadHostnameAllowAccess"
          name="workloadHostnameAllowAccess"
          auto
          :isCard="false"
          title="Workload Domain Allow Access"
          subtitle="Allow direct access to the default Workload domain generated after Workload creation (e.g id.map.azionedge.net)."
        />
      </div>
    </template>
  </form-horizontal>
</template>
