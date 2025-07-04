<template>
  <FormHorizontal
    title="HMAC"
    description="Provide HMAC authentication credentials to deliver private content."
    data-testid="edge-connectors-form__section__hmac"
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-2">
        <FieldSwitchBlock
          nameField="modules.originShield.config.hmac.enabled"
          name="modules.originShield.config.hmac.enabled"
          auto
          :isCard="false"
          :value="hmacActive"
          title="Active"
          data-testid="edge-connectors-form__hmac__hmac-active-field"
        />
      </div>
      <div
        class="flex flex-col sm:max-w-sm w-full gap-2"
        v-if="hmacActive"
      >
        <FieldTextIcon
          label="Type"
          required
          description="The HMAC authentication type is fixed to aws4_hmac_sha256, compatible with AWS S3 object storage."
          name="modules.originShield.config.hmac.config.type"
          :value="hmacType"
          placeholder="aws4_hmac_sha256"
          data-testid="edge-connectors-form__hmac__hmac-type-field"
          icon="pi pi-lock"
          disabled
        />
      </div>
      <div
        class="flex flex-col sm:max-w-xs w-full gap-2"
        v-if="hmacActive"
      >
        <FieldText
          label="Region"
          required
          description="Region supported by the object storage provider."
          name="modules.originShield.config.hmac.config.attributes.region"
          :value="region"
          placeholder="us-east-1"
          data-testid="edge-connectors-form__hmac__region-field"
        />
      </div>
      <div
        class="flex flex-col sm:max-w-xs w-full gap-2"
        v-if="hmacActive"
      >
        <FieldText
          label="Service"
          required
          description="Specify the service name for the object storage provider (e.g., s3)."
          name="modules.originShield.config.hmac.config.attributes.service"
          :value="service"
          placeholder="s3"
          data-testid="edge-connectors-form__hmac__service-field"
        />
      </div>
      <div
        class="flex flex-col sm:max-w-xs w-full gap-2"
        v-if="hmacActive"
      >
        <FieldText
          label="Access Key"
          required
          description="Enter the Access Key provided by the object storage provider."
          name="modules.originShield.config.hmac.config.attributes.accessKey"
          :value="accessKey"
          placeholder="Access Key"
          data-testid="edge-connectors-form__hmac__access-key-field"
        />
      </div>
      <div
        class="flex flex-col sm:max-w-xs w-full gap-2"
        v-if="hmacActive"
      >
        <FieldTextIcon
          label="Secret Key"
          required
          description="Enter the Secret Key provided by the object storage provider."
          name="modules.originShield.config.hmac.config.attributes.secretKey"
          :value="secretKey"
          placeholder="**********"
          data-testid="edge-connectors-form__hmac__secret-key-field"
          icon="pi pi-eye"
        />
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import { onMounted } from 'vue'
  import { useField } from 'vee-validate'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import FieldTextIcon from '@/templates/form-fields-inputs/fieldTextIcon'
  import FieldText from '@/templates/form-fields-inputs/fieldText'

  defineOptions({ name: 'EdgeConnectorsFormFieldsHmac' })

  const { value: hmacActive } = useField('modules.originShield.config.hmac.enabled')
  const { value: hmacType } = useField('modules.originShield.config.hmac.config.type')
  const { value: region } = useField('modules.originShield.config.hmac.config.attributes.region')
  const { value: service } = useField('modules.originShield.config.hmac.config.attributes.service')
  const { value: accessKey } = useField(
    'modules.originShield.config.hmac.config.attributes.accessKey'
  )
  const { value: secretKey } = useField(
    'modules.originShield.config.hmac.config.attributes.secretKey'
  )

  onMounted(() => {
    hmacType.value = 'aws4_hmac_sha256'
  })
</script>
