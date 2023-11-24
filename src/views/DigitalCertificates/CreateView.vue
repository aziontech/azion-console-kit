<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create Digital Certificate"></PageHeadingBlock>
    </template>
    <template #content>
      <CreateFormBlock
        :createService="createServiceBySelectedType"
        :formData="values"
        :formMeta="meta"
        :cleanFormCallback="resetForm"
      >
        <template #form>
          <InlineMessage
            class="w-fit"
            severity="info"
            >Now you can easily create a Let's Encrypt™ digital certificate directly from
            <PrimeButton
              link
              size="small"
              class="p-0"
              @click="navigateToDomains"
            >
              Domains
            </PrimeButton>
          </InlineMessage>
          <FormHorizontal
            title="General"
            description="Description"
          >
            <template #inputs>
              <div class="flex flex-col sm:max-w-lg w-full gap-2">
                <label
                  for="name"
                  class="text-color text-base font-medium"
                  >Name *</label
                >
                <InputText
                  v-bind="digitalCertificateName"
                  type="text"
                  id="name"
                  :class="{ 'p-invalid': errors.digitalCertificateName }"
                />
                <small
                  v-if="errors.digitalCertificateName"
                  class="p-error text-xs font-normal leading-tight"
                  >{{ errors.digitalCertificateName }}</small
                >
              </div>
            </template>
          </FormHorizontal>
          <FormHorizontal
            title="Certificate Type"
            description="Bring a TLS X.509 digital certificate and private key obtained
        from a certificate authority or a Trusted CA for mTLS authentication.
        As an alternative, generate a Certificate Signing Request (CSR) with Azion and submit it to a certificate authority."
          >
            <template #inputs>
              <div class="flex flex-col w-full gap-3">
                <Card
                  :pt="{
                    body: { class: 'p-4' },
                    title: { class: 'flex justify-between  text-base m-0 font-medium' },
                    subtitle: {
                      class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
                    }
                  }"
                >
                  <template #title>
                    <span class="text-base">Edge Certificate - Upload</span>
                    <RadioButton
                      v-model="certificateType"
                      inputId="certificateType2"
                      name="certificateType"
                      :value="certificateTypes.EDGE_CERTIFICATE_UPLOAD"
                    />
                  </template>
                  <template #subtitle> Upload your certificate and private key. </template>
                </Card>

                <Card
                  :pt="{
                    body: { class: 'p-4' },
                    title: { class: 'flex justify-between  text-base m-0 font-medium' },
                    subtitle: {
                      class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
                    }
                  }"
                >
                  <template #title>
                    <span class="text-base">Edge Certificate - Generate</span>
                    <RadioButton
                      v-model="certificateType"
                      inputId="certificateType1"
                      name="certificateType"
                      :value="certificateTypes.EDGE_CERTIFICATE_CSR"
                    />
                  </template>
                  <template #subtitle> Generate CSR and private key with Azion. </template>
                </Card>

                <Card
                  :pt="{
                    body: { class: 'p-4' },
                    title: { class: 'flex justify-between  text-base m-0 font-medium' },
                    subtitle: {
                      class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
                    }
                  }"
                >
                  <template #title>
                    <span class="text-base">Trusted CA Certificate</span>
                    <RadioButton
                      v-model="certificateType"
                      inputId="certificateType3"
                      name="certificateType"
                      :value="certificateTypes.TRUSTED"
                    />
                  </template>
                  <template #subtitle>
                    Upload your Trusted CA Certificate to Azion servers.
                  </template>
                </Card>
              </div>
            </template>
          </FormHorizontal>
          <FormHorizontal
            v-if="certificateType === certificateTypes.EDGE_CERTIFICATE_UPLOAD"
            title="Upload Certificate and Private Key"
            description="To upload a digital certificate, copy and paste the certificate and private key codes in the respective fields, including the begin and end tags."
          >
            <template #inputs>
              <div class="flex flex-col sm:max-w-lg w-full gap-2">
                <label>Certificate *</label>
                <PrimeTextarea
                  v-bind="certificate"
                  :class="{ 'p-invalid': errors.certificate }"
                  placeholder="-----BEGIN CERTIFICATE-----&#10;-----END CERTIFICATE-----"
                  rows="5"
                  cols="30"
                />
                <small class="text-color-secondary text-xs font-normal leading-tight"
                  >Intermediate certificates are accepted.</small
                >
                <small
                  v-if="errors.certificate"
                  class="p-error text-xs font-normal leading-tight"
                  >{{ errors.certificate }}</small
                >
              </div>
              <div class="flex flex-col sm:max-w-lg w-full gap-2">
                <label>Private key</label>
                <PrimeTextarea
                  v-model="privateKey"
                  :class="{ 'p-invalid': errors.privateKey }"
                  placeholder="-----BEGIN PRIVATE KEY-----&#10;-----END PRIVATE KEY-----"
                  rows="5"
                  cols="30"
                />
                <small
                  v-if="errors.privateKey"
                  class="p-error text-xs font-normal leading-tight"
                  >{{ errors.privateKey }}</small
                >
              </div>
            </template>
          </FormHorizontal>

          <FormHorizontal
            title="Generate CSR and Private Key with Azion"
            description="To apply for a digital certificate issued by a certificate authority, a Certificate Signing Request is required.
        Azion can generate a certificate code to submit to a certificate authority."
            v-if="certificateType === certificateTypes.EDGE_CERTIFICATE_CSR"
          >
            <template #inputs>
              <div class="flex flex-col sm:max-w-lg w-full gap-2">
                <label>Subject Name *</label>
                <InputText
                  placeholder="example.com"
                  v-bind="common"
                  type="text"
                  :class="{ 'p-invalid': errors.common }"
                />
                <small
                  v-if="errors.common"
                  class="p-error text-xs font-normal leading-tight"
                  >{{ errors.common }}</small
                >
              </div>
              <div class="flex flex-col sm:max-w-lg w-full gap-2">
                <label>Country/Region *</label>
                <InputText
                  placeholder="BR"
                  v-bind="country"
                  type="text"
                  :class="{ 'p-invalid': errors.country }"
                />
                <small
                  v-if="errors.country"
                  class="p-error text-xs font-normal leading-tight"
                  >{{ errors.country }}</small
                >
              </div>
              <div class="flex flex-col sm:max-w-lg w-full gap-2">
                <label>State/Province *</label>
                <InputText
                  placeholder="São Paulo"
                  v-bind="state"
                  type="text"
                  :class="{ 'p-invalid': errors.state }"
                />
                <small
                  v-if="errors.state"
                  class="p-error text-xs font-normal leading-tight"
                  >{{ errors.state }}</small
                >
              </div>
              <div class="flex flex-col sm:max-w-lg w-full gap-2">
                <label>City/Locality *</label>
                <InputText
                  placeholder="São Paulo"
                  v-bind="city"
                  type="text"
                  :class="{ 'p-invalid': errors.city }"
                />
                <small
                  v-if="errors.city"
                  class="p-error text-xs font-normal leading-tight"
                  >{{ errors.city }}</small
                >
              </div>
              <div class="flex flex-col sm:max-w-lg w-full gap-2">
                <label>Organization *</label>
                <InputText
                  placeholder="Company Name S.A."
                  v-bind="organization"
                  type="text"
                  :class="{ 'p-invalid': errors.organization }"
                />
                <small
                  v-if="errors.organization"
                  class="p-error text-xs font-normal leading-tight"
                  >{{ errors.organization }}</small
                >
              </div>
              <div class="flex flex-col sm:max-w-lg w-full gap-2">
                <label>Organization Unit *</label>
                <InputText
                  placeholder="IT Department"
                  v-bind="organizationUnity"
                  type="text"
                  :class="{ 'p-invalid': errors.organizationUnity }"
                />
                <small
                  v-if="errors.organizationUnity"
                  class="p-error text-xs font-normal leading-tight"
                  >{{ errors.organizationUnity }}</small
                >
              </div>
              <div class="flex flex-col sm:max-w-lg w-full gap-2">
                <label>Email *</label>
                <InputText
                  placeholder="example@email.com"
                  v-bind="email"
                  type="text"
                  :class="{ 'p-invalid': errors.email }"
                />
                <small
                  v-if="errors.email"
                  class="p-error text-xs font-normal leading-tight"
                  >{{ errors.email }}</small
                >
              </div>
              <div class="flex flex-col sm:max-w-lg w-full gap-2">
                <label>Private Key Type</label>
                <span class="p-input-icon-right w-full">
                  <i class="pi pi-lock text-color-secondary" />
                  <InputText
                    v-bind="privateKeyType"
                    type="text"
                    disabled
                    class="w-full"
                    :class="{ 'p-invalid': errors.privateKeyType }"
                  />
                </span>
                <small
                  v-if="errors.privateKeyType"
                  class="p-error text-xs font-normal leading-tight"
                  >{{ errors.privateKeyType }}</small
                >
              </div>
              <div class="flex flex-col sm:max-w-lg w-full gap-2">
                <label>Subject Alternative Names (SAN) </label>
                <PrimeTextarea
                  v-bind="subjectAlternativeNames"
                  :class="{ 'p-invalid': errors.subjectAlternativeNames }"
                  placeholder="www.example.com&#10;example.net&#10;mail.example.com&#10;support.example.com"
                  rows="5"
                  cols="30"
                />
                <small class="text-color-secondary text-xs font-normal leading-tight"
                  >Separate SAN using a new line. Duplicate entries will be automatically
                  removed.</small
                >
                <small
                  v-if="errors.subjectAlternativeNames"
                  class="p-error text-xs font-normal leading-tight"
                  >{{ errors.subjectAlternativeNames }}</small
                >
              </div>
            </template>
          </FormHorizontal>

          <FormHorizontal
            title="Upload Trusted CA certificate"
            description="A Trusted Certificate Authority (CA) certificate can be used for Mutual Transport Layer Security (mTLS) configuration. To upload a Trusted CA Certificate to Azion, paste the certificate code in the respective field."
            v-if="certificateType === certificateTypes.TRUSTED"
          >
            <template #inputs>
              <div class="flex flex-col sm:max-w-lg w-full gap-2">
                <label>Certificate *</label>
                <PrimeTextarea
                  v-bind="certificate"
                  :class="{ 'p-invalid': errors.certificate }"
                  placeholder="---BEGIN CERTIFICATE---"
                  rows="5"
                  cols="30"
                />
                <small class="text-color-secondary text-xs font-normal leading-tight"
                  >Intermediate certificates are accepted.</small
                >
                <small
                  v-if="errors.certificate"
                  class="p-error text-xs font-normal leading-tight"
                  >{{ errors.certificate }}</small
                >
              </div>
            </template>
          </FormHorizontal>
        </template>
      </CreateFormBlock>
    </template>
  </ContentBlock>
</template>

<script>
  import CreateFormBlock from '@/templates/create-form-block-new'
  import Card from 'primevue/card'
  import RadioButton from 'primevue/radiobutton'
  import PrimeTextarea from 'primevue/textarea'
  import PrimeButton from 'primevue/button'
  import InputText from 'primevue/inputtext'
  import InlineMessage from 'primevue/inlinemessage'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import FormHorizontal from '@/templates/create-form-block-new/form-horizontal'
  import { useForm, useField } from 'vee-validate'
  import * as yup from 'yup'
  import { ref, watch } from 'vue'

  export default {
    components: {
      CreateFormBlock,
      FormHorizontal,
      RadioButton,
      PrimeButton,
      Card,
      PrimeTextarea,
      InputText,
      InlineMessage,
      ContentBlock,
      PageHeadingBlock
    },
    props: {
      createDigitalCertificatesService: {
        type: Function,
        required: true
      },
      createDigitalCertificatesCSRService: {
        type: Function,
        required: true
      }
    },
    setup(props) {
      const createDigitalCertificateService = props.createDigitalCertificatesService
      const createCSRService = props.createDigitalCertificatesCSRService
      const createServiceBySelectedType = ref(createDigitalCertificateService)

      const certificateTypes = {
        EDGE_CERTIFICATE_UPLOAD: 'uploadCertificateAndPrivateKey',
        EDGE_CERTIFICATE_CSR: 'generateCSR',
        TRUSTED: 'trusted_ca_certificate'
      }

      const CSRConditionalValidations = {
        is: certificateTypes.EDGE_CERTIFICATE_CSR,
        then: (schema) => schema.required('Field Required')
      }
      const certificateRequiredField = (certificateType) => {
        const isUploadCertificate = certificateType === certificateTypes.EDGE_CERTIFICATE_UPLOAD
        const isTrustedCA = certificateType === certificateTypes.TRUSTED

        return isUploadCertificate || isTrustedCA
      }

      const validationSchema = yup.object({
        digitalCertificateName: yup.string().required('Name is a required field.'),

        // Certificate Choices
        certificateType: yup.string().required('Choose a certificate type.'),

        // Edge Certificate Fields
        certificate: yup.string().when(['certificateType'], {
          is: certificateRequiredField,
          then: (schema) => schema.required('Certificate is a required field.')
        }),
        privateKey: yup.string(),

        // CSR Fields
        common: yup.string().when('certificateType', CSRConditionalValidations),
        state: yup.string().when('certificateType', CSRConditionalValidations),
        city: yup.string().when('certificateType', CSRConditionalValidations),
        organization: yup.string().when('certificateType', CSRConditionalValidations),
        organizationUnity: yup
          .string()
          .when('certificateType', CSRConditionalValidations)
          .label('organization unity'),
        privateKeyType: yup
          .string()
          .when('certificateType', CSRConditionalValidations)
          .label('private key type'),
        subjectAlternativeNames: yup
          .string()
          .when('certificateType', CSRConditionalValidations)
          .label('subject alternative names (SAN)'),
        country: yup.string().when('certificateType', {
          is: certificateTypes.EDGE_CERTIFICATE_CSR,
          then: (schema) =>
            schema
              .required('Country/Region is a required field.')
              .max(2, 'Country/Region must be a 2-character country code.')
              .min(2, 'Country/Region must be a 2-character country code.')
        }),
        email: yup.string().when('certificateType', {
          is: certificateTypes.EDGE_CERTIFICATE_CSR,
          then: (schema) => schema.required('Email is a required field.').email()
        })
      })

      const { errors, defineInputBinds, defineComponentBinds, meta, resetForm, values } = useForm({
        validationSchema,
        initialValues: {
          digitalCertificateName: '',

          // Form Choices
          certificateType: certificateTypes.EDGE_CERTIFICATE_UPLOAD,

          // Edge Certificate values
          certificate: '',
          privateKey: undefined,

          // CSR values
          common: '',
          country: '',
          state: '',
          city: '',
          organization: '',
          organizationUnity: '',
          email: '',
          privateKeyType: 'RSA (2048)',
          subjectAlternativeNames: ''
        }
      })

      const digitalCertificateName = defineInputBinds('digitalCertificateName', {
        validateOnInput: true
      })
      const certificate = defineComponentBinds('certificate', { validateOnInput: true })
      const { value: privateKey, setValue: setPrivateKeyValue } = useField('privateKey')

      // CSR Binds
      const common = defineInputBinds('common', { validateOnInput: true })
      const country = defineInputBinds('country', { validateOnInput: true })
      const state = defineInputBinds('state', { validateOnInput: true })
      const city = defineInputBinds('city', { validateOnInput: true })
      const organization = defineInputBinds('organization', { validateOnInput: true })
      const organizationUnity = defineInputBinds('organizationUnity', { validateOnInput: true })
      const email = defineInputBinds('email', { validateOnInput: true })
      const privateKeyType = defineInputBinds('privateKeyType', { validateOnInput: true })
      const subjectAlternativeNames = defineComponentBinds('subjectAlternativeNames', {
        validateOnInput: true
      })

      const { value: certificateType } = useField('certificateType')

      watch(certificateType, () => {
        const isEdgeCertificateCSR = certificateType.value === certificateTypes.EDGE_CERTIFICATE_CSR

        createServiceBySelectedType.value = createDigitalCertificateService

        if (isEdgeCertificateCSR) {
          createServiceBySelectedType.value = createCSRService
        }

        if (!isEdgeCertificateCSR) setPrivateKeyValue(undefined)
      })

      watch(privateKey, (privateKeyValue) => {
        if (privateKeyValue === '') setPrivateKeyValue(undefined)
      })

      return {
        createServiceBySelectedType,
        values,
        meta,
        errors,
        resetForm,
        common,
        country,
        state,
        city,
        organization,
        organizationUnity,
        email,
        privateKeyType,
        certificate,
        privateKey,
        certificateType,
        digitalCertificateName,
        subjectAlternativeNames,
        certificateTypes
      }
    },
    methods: {
      navigateToDomains() {
        this.$router.push({ name: 'list-domains' })
      }
    }
  }
</script>
