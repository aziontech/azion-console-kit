<template>
  <FormHorizontal
    title="HMAC"
    description="Provide HMAC authentication credentials to deliver private content."
    data-testid="edge-connectors-form__section__hmac"
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-2">
        <FieldSwitchBlock
          nameField="hmacActive"
          name="hmacActive"
          auto
          :isCard="false"
          :value="hmacActive"
          title="Active"
          data-testid="edge-connectors-form__hmac__hmac-active-field"
        />
      </div>
      <div class="flex flex-col sm:max-w-sm w-full gap-2">
        <FieldTextIcon
          label="Type"
          required
          description="The HMAC authentication type is fixed to aws4_hmac_sha256, compatible with AWS S3 object storage."
          name="hmacType"
          :value="hmacType"
          placeholder="aws4_hmac_sha256"
          data-testid="edge-connectors-form__hmac__hmac-type-field"
          icon="pi pi-lock"
          disabled
        />
      </div>
      <div class="flex flex-col sm:max-w-xs w-full gap-2">
        <FieldText
          label="Region"
          required
          description="Region supported by the object storage provider."
          name="region"
          :value="region"
          placeholder="us-east-1"
          data-testid="edge-connectors-form__hmac__region-field"
        />
      </div>
      <div class="flex flex-col sm:max-w-xs w-full gap-2">
        <FieldText
          label="Service"
          required
          description="Specify the service name for the object storage provider (e.g., s3)."
          name="service"
          :value="service"
          placeholder="s3"
          data-testid="edge-connectors-form__hmac__service-field"
        />
      </div>
      <div class="flex flex-col sm:max-w-xs w-full gap-2">
        <FieldTextIcon
          label="Access Key"
          required
          description="Enter the Access Key provided by the object storage provider."
          name="accessKey"
          :value="accessKey"
          placeholder="**********"
          data-testid="edge-connectors-form__hmac__access-key-field"
          icon="pi pi-eye"
        />
      </div>
      <div class="flex flex-col sm:max-w-xs w-full gap-2">
        <FieldTextIcon
          label="Secret Key"
          required
          description="Enter the Secret Key provided by the object storage provider."
          name="secretKey"
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

  const { value: hmacActive } = useField('hmacActive')
  const { value: hmacType } = useField('hmacType')
  const { value: region } = useField('region')
  const { value: service } = useField('service')
  const { value: accessKey } = useField('accessKey')
  const { value: secretKey } = useField('secretKey')

  onMounted(() => {
    hmacType.value = 'aws4_hmac_sha256'
  })
</script>
