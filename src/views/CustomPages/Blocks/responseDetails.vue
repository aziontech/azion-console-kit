<template>
  <FormHorizontal
    isDrawer
    title="Response Details"
    description="Customize the response for this status code. Specify the URI, status code, TTL, content type, and the response body to be returned to the client."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldDropdownLazyLoader
          label="Edge Connector"
          required
          name="connector"
          :service="listEdgeConnectorsService"
          :loadService="edgeConnectorsService.loadEdgeConnectorsService"
          optionLabel="name"
          optionValue="value"
          :value="connector"
          placeholder="Select a Edge Connector"
        >
          <template #footer>
            <ul class="p-2">
              <li>
                <PrimeButton
                  @click="openDigitalCertificateTrustedDrawer"
                  class="w-full whitespace-nowrap flex"
                  text
                  size="small"
                  icon="pi pi-plus-circle"
                  data-testid="domains-form__create-digital-certificate-trusted-button"
                  :pt="{
                    label: { class: 'w-full text-left' },
                    root: { class: 'p-2' }
                  }"
                  label="Create Digital Trusted CA certificate"
                />
              </li>
            </ul>
          </template>
        </FieldDropdownLazyLoader>
        <!-- Response -->
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Page Path (URI)"
          placeholder="/path/error_page.html"
          :name="uri"
          :value="uri"
        />
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldNumber
          label="Response Custom Status Code"
          required
          :value="customStatusCode"
          name="customStatusCode"
          :min="100"
          :max="599"
        />
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldNumber
          label="Response TTL"
          required
          :value="ttl"
          name="ttl"
          :min="0"
          :max="31536000"
        />
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Content Type"
          placeholder="text/html"
          :name="contentType"
          :value="contentType"
          disabled
        />
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldTextarea
          label="Response"
          placeholder="Response body"
          :name="response"
          :value="response"
        />
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal.vue'
  import FieldDropdownLazyLoader from '@/templates/form-fields-inputs/fieldDropdownLazyLoader'
  import FieldNumber from '@/templates/form-fields-inputs/fieldNumber'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  
  import { edgeConnectorsService } from '@/services/v2'

</script>
