<template>
  <FormHorizontal
    title="General"
    description="Create a stream to feed your data platforms with logs from your applications."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name *"
          description="Give a unique and descriptive name to identify the data stream."
          name="name"
          placeholder="My stream"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Data Settings"
    description="Define the source and the variables from which data should be collected."
  >
    <template #inputs>
      <div class="flex flex-wrap gap-6">
        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <FieldDropdown
            label="Source *"
            name="dataSource"
            :options="listDataSources"
            optionLabel="label"
            optionValue="value"
            :value="dataSource"
            appendTo="self"
            description="Represents the data source the data will be collected from."
          />
        </div>
        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <FieldDropdown
            label="Template *"
            name="template"
            :options="listTemplates"
            optionLabel="label"
            optionValue="value"
            :value="template"
            appendTo="self"
            description="Represents a preset of variables for specific sources or an open template to choose variables."
          />
        </div>
      </div>
      <div class="flex flex-col gap-2">
        <label
          for="dataset"
          class="text-color text-base font-medium"
          >Data Set</label
        >
        <vue-monaco-editor
          v-model:value="dataSet"
          language="json"
          :theme="theme"
          :options="dataSetMonacoOptions"
          class="min-h-[300px] surface-border border rounded-sm overflow-hidden"
        />
        <small class="text-xs text-color-secondary font-normal leading-5">
          Exhibits or allows writing the variables that'll be sent to the connector in a JSON
          format.
        </small>
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="Domains"
    description="Associate domains with this stream to define the addresses from which the data will be collected."
  >
    <template #inputs>
      <div class="flex flex-col gap-4">
        <FieldGroupRadio
          label="Option"
          nameField="domainOption"
          :isCard="false"
          :options="domainsRadioOptions"
        />
      </div>

      <div
        v-if="domainOption === '0'"
        class="flex flex-col gap-2"
      >
        <label
          for="domains"
          class="text-color text-base font-medium"
          >Domains *</label
        >
        <PickList
          v-model="domains"
          :pt="{
            sourceList: { class: ['h-80'] },
            targetList: { class: ['h-80'] }
          }"
          dataKey="domainID"
          breakpoint="1400px"
          :showSourceControls="false"
          :showTargetControls="false"
        >
          <template #sourceheader>Available Domains</template>
          <template #targetheader>Chosen Domains</template>
          <template #item="slotProps">
            <div class="flex flex-wrap p-2 align-items-center gap-3">
              <div class="flex-1 flex flex-column gap-2">
                <span class="font-normal">{{ slotProps.item.name }}</span>
              </div>
            </div>
          </template>
        </PickList>

        <small class="text-xs text-color-secondary font-normal leading-5">
          Select an item from the list and then use the arrows to move it between the available and
          selected domains boxes. Use the double-line arrows to move all items or press the
          <code>ctrl</code> or <code>command</code> keys to select multiple items.
        </small>
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    v-if="domainOption === '1'"
    title="Sampling"
    class="hidden"
    description="Enable this option to reduce costs of data collection and analysis."
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-8">
        <FieldSwitchBlock
          nameField="hasSampling"
          name="hasSampling"
          auto
          :isCard="false"
          title="Active"
          subtitle="Once enabled, you can only have one active stream in your account. If it's later disabled, the Add option will become available again on the creation page."
        />

        <div
          class="flex flex-col sm:max-w-lg w-full gap-2"
          v-if="hasSampling"
        >
          <FieldNumber
            label="Sampling Percentage (%)"
            name="samplingPercentage"
            :value="samplingPercentage"
            description="Percentage value received in return of the total data related to all domains."
            :min="0"
            :max="100"
          />
        </div>
        <InlineMessage
          class="w-fit"
          severity="warn"
          v-if="hasSampling"
        >
          After activating and saving these settings, all other streams will become inactive.
        </InlineMessage>
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Destination"
    description="Define to which data platform your collected data will be sent to. All fields must be filled in with information provided by the third-party platform."
  >
    <template #inputs>
      <div class="flex flex-col w-full sm:max-w-xs gap-2">
        <FieldDropdown
          label="Connector *"
          name="endpoint"
          :options="listEndpoint"
          optionLabel="label"
          optionValue="value"
          :value="endpoint"
          appendTo="self"
          description="Each option represents a different platform and requires different values."
        />
      </div>

      <!-- Specific Sections for Different Endpoints -->
      <div
        id="standard"
        class="flex flex-col gap-8 max-md:gap-6"
        v-if="endpoint === 'standard'"
      >
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="URL *"
            description="Specific URL that'll receive the collected data."
            name="endpointUrl"
            :value="endpointUrl"
            placeholder="https://app.domain.com/"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label
            for="customHeaders"
            class="text-color text-base font-medium"
            >Custom Headers</label
          >
          <div
            class="flex p-inputgroup"
            v-for="(header, index) in headers"
            :key="index"
          >
            <InputText
              v-model="header.value"
              type="text"
              id="header-value"
              placeholder="header-name:value"
            />
            <ButtonPrimer
              icon="pi pi-trash"
              size="small"
              outlined
              v-if="header.deleted"
              @click="removeHeader(index)"
            />
          </div>

          <ButtonPrimer
            outlined
            icon="pi pi-plus-circle"
            iconPos="left"
            label="Header"
            size="small"
            class="w-fit"
            @click="addHeader()"
          />
        </div>
      </div>

      <div
        id="kafka"
        class="flex flex-col gap-8 max-md:gap-6"
        v-if="endpoint === 'kafka'"
      >
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldTextArea
            label="Bootstrap Servers *"
            name="bootstrapServers"
            rows="5"
            :value="bootstrapServers"
            placeholder="host1:port1,host2:port2,..."
            description="List of hosts and ports in a Kafka cluster. Separate items by comma and no space.."
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Kafka Topic *"
            name="kafkaTopic"
            :value="kafkaTopic"
            description="Name of the topic in a Kafka cluster."
            placeholder="analytics.fct.pageviews.0"
          />
        </div>

        <div class="flex sm:max-w-lg w-full gap-2 items-top">
          <InputSwitch
            v-model="useTls"
            id="useTls"
            class="flex-shrink-0 flex-grow"
            :class="{ 'p-invalid': useTlsError }"
          />
          <div class="flex flex-col gap-1">
            <label
              for="useTls"
              class="text-sm font-normal leading-tight"
              >Enable Transport Layer Security (TLS)</label
            >
            <small class="text-xs text-color-secondary font-normal leading-5">
              Send encrypted data to secure communication. Make sure the receiving connector uses a
              trusted CA certificate.
            </small>
          </div>
        </div>
      </div>

      <div
        id="s3"
        class="flex flex-col gap-8 max-md:gap-6"
        v-if="endpoint === 's3'"
      >
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="URL *"
            name="host"
            :value="host"
            description="Specific URL that'll receive the collected data. Accepts all providers that work with an S3 protocol."
            placeholder="https://myownhost.s3.us-east-1.myprovider.com"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Bucket Name *"
            name="bucket"
            :value="bucket"
            description="Name of the bucket to which the object will be sent."
            placeholder="mys3bucket"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Region *"
            name="region"
            :value="region"
            description="Region in which your bucket is hosted."
            placeholder="us-east-1"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label
            for="accessKey"
            class="text-color text-base font-medium"
            >Access Key *</label
          >
          <PrimePassword
            id="accessKey"
            v-model="accessKey"
            type="text"
            class="flex flex-col w-full"
            :class="{ 'p-invalid': accessKeyError }"
            :feedback="false"
            toggleMask
            placeholder="ORIA5ZEH9MW4NL5OITY4"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Public key to access the bucket.
          </small>
          <small
            id="access-key-help"
            class="p-error"
            >{{ accessKeyError }}</small
          >
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label
            for="secretKey"
            class="text-color text-base font-medium"
            >Secret Key *</label
          >
          <PrimePassword
            id="secretKey"
            v-model="secretKey"
            type="text"
            placeholder="+PLjkUWJyOLth3anuWXcLLVrMLeiiiThIokaPEiw"
            class="flex flex-col w-full"
            :class="{ 'p-invalid': secretKeyError }"
            :feedback="false"
            toggleMask
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Secret key to access the bucket.
          </small>
          <small
            id="secret-key-help"
            class="p-error"
            >{{ secretKeyError }}</small
          >
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label
            for="objectKeyPrefix"
            class="text-color text-base font-medium"
            >Object Key Prefix</label
          >
          <PrimePassword
            id="objectKey"
            v-model="objectKey"
            type="text"
            placeholder="waf_logs_1622575860091_37d66e78-c308-4006-9d4d-1c013ed89276"
            class="flex flex-col w-full"
            :class="{ 'p-invalid': objectKeyError }"
            :feedback="false"
            toggleMask
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Prefix added to the name of the uploaded object to appear on the files that'll be sent.
            Composed of Prefix + Timestamp + UUID.
          </small>
          <small
            id="object-key-help"
            class="p-error"
            >{{ objectKeyError }}</small
          >
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-color text-sm font-medium leading-tight">Content Type *</label>
          <div class="flex flex-col gap-3">
            <div
              class="flex no-wrap gap-2 items-center"
              v-for="contentTypeItem of listContentType"
              :key="contentTypeItem.value"
            >
              <RadioButton
                :class="{ 'p-invalid': contentTypeError }"
                v-model="contentType"
                inputId="contentType"
                :name="contentTypeItem.value"
                :value="contentTypeItem.value"
              />
              <label class="text-color text-sm font-normal leading-tight">{{
                contentTypeItem.label
              }}</label>
            </div>
          </div>
        </div>
      </div>

      <div
        id="big_query"
        class="flex flex-col gap-8 max-md:gap-6"
        v-if="endpoint === 'big_query'"
      >
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Project ID *"
            name="projectID"
            :value="projectID"
            description="ID of the project in Google Cloud."
            placeholder="mycustomGBQproject01"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Dataset ID *"
            name="datasetID"
            :value="datasetID"
            description="Name of the dataset created on Google BigQuery. Case sensitive field."
            placeholder="myGBQdataset"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Table ID *"
            name="tableID"
            :value="tableID"
            description="Name of the table on Google BigQuery."
            placeholder="mypagaviewtable01"
          />
        </div>

        <div class="flex flex-col w-full gap-2">
          <label
            for="serviceAccountKey"
            class="text-color text-base font-medium"
            >Service Account Key *</label
          >
          <vue-monaco-editor
            v-model:value="serviceAccountKey"
            language="json"
            :theme="theme"
            :options="serviceAccountMonacoOptions"
            class="min-h-[300px] surface-border border rounded-md overflow-hidden"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            JSON file provided by Google Cloud used to authenticate with Google services.
          </small>
          <small
            id="service-account-key-help"
            class="p-error"
            >{{ serviceAccountKeyError }}</small
          >
        </div>
      </div>

      <div
        id="elasticsearch"
        class="flex flex-col gap-8 max-md:gap-6"
        v-if="endpoint === 'elasticsearch'"
      >
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="URL *"
            name="elasticsearchUrl"
            :value="elasticsearchUrl"
            description="URL address plus the Elasticsearch index that'll receive the collected data."
            placeholder="https://elasticsearch-domain.com/myindex"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldTextArea
            label="API Key *"
            name="apiKey"
            :value="apiKey"
            rows="5"
            placeholder="VuaCfGcBCdbkQm-e5aOx:ui2lp2axTNmsyakw9tvNnw"
            description="API key used for Elasticsearch authorization in base64 encode format."
          />
        </div>
      </div>

      <div
        id="splunk"
        class="flex flex-col gap-8 max-md:gap-6"
        v-if="endpoint === 'splunk'"
      >
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="URL *"
            name="splunkUrl"
            :value="splunkUrl"
            description="URL that'll receive the collected data. If you have an alternative index to point, add it at the end of the URL."
            placeholder="https://inputs.splunk-client.splunkcloud.com:123456/services/collector"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldTextArea
            label="API Key *"
            name="splunkApiKey"
            :value="splunkApiKey"
            placeholder="crfe25d2-23j8-48gf-a9ks-6b75w3ska674"
            description="HTTP Event Collector Token provided during the Splunk installation."
          />
        </div>
      </div>

      <div
        id="aws_kinesis_firehose"
        class="flex flex-col gap-8 max-md:gap-6"
        v-if="endpoint === 'aws_kinesis_firehose'"
      >
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Stream Name *"
            name="streamName"
            :value="streamName"
            description="Delivery stream name."
            placeholder="MyKDFConnector"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Region *"
            name="awsRegion"
            :value="awsRegion"
            description="Region where the Amazon Kinesis instance is running."
            placeholder="us-east-1"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label
            for="accessKey"
            class="text-color text-base font-medium"
            >Access Key *</label
          >
          <PrimePassword
            id="awsAccessKey"
            v-model="awsAccessKey"
            type="text"
            placeholder="ORIA5ZEH9MW4NL5OITY4"
            class="flex flex-col w-full"
            :class="{ 'p-invalid': awsAccessKeyError }"
            :feedback="false"
            toggleMask
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Public key to access the Data Firehose given by AWS.
          </small>
          <small
            id="aws-access-key-help"
            class="p-error"
            >{{ awsAccessKeyError }}</small
          >
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label
            for="accessKey"
            class="text-color text-base font-medium"
            >Secret Key *</label
          >
          <PrimePassword
            id="awsSecretKey"
            v-model="awsSecretKey"
            type="text"
            placeholder="+PLjkUWJyOLth3anuWXcLLVrMLeiiiThIokaPEiw"
            class="flex flex-col w-full"
            :class="{ 'p-invalid': awsSecretKeyError }"
            :feedback="false"
            toggleMask
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Secret key to access the Data Firehose given by AWS.
          </small>
          <small
            id="aws-secret-key-help"
            class="p-error"
            >{{ awsSecretKeyError }}</small
          >
        </div>
      </div>

      <div
        id="datadog"
        class="flex flex-col gap-8 max-md:gap-6"
        v-if="endpoint === 'datadog'"
      >
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="URL *"
            name="datadogUrl"
            :value="datadogUrl"
            description="URL or URI of the Datadog endpoint."
            placeholder="https://http-intake.logs.datadoghq.com/v1/input"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldTextArea
            label="API Key *"
            name="datadogApiKey"
            :value="datadogApiKey"
            placeholder="ij9076f1ujik17a81f938yhru5g713422"
            description="API key generated through the Datadog dashboard."
          />
        </div>
      </div>

      <div
        id="qradar"
        class="flex flex-col gap-8 max-md:gap-6"
        v-if="endpoint === 'qradar'"
      >
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="URL *"
            name="QRadarUrl"
            :value="QRadarUrl"
            description="Specific URL that'll receive the collected data."
            placeholder="http://137.15.824.10:14440"
          />
        </div>
      </div>

      <div
        id="azure_monitor"
        class="flex flex-col gap-8 max-md:gap-6"
        v-if="endpoint === 'azure_monitor'"
      >
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Log Type *"
            name="logType"
            :value="logType"
            description="Record type of the data that's being submitted. Accepts only letters, numbers, and the underscore (_) character, and it can't exceed 100 characters."
            placeholder="AzureMonitorTest"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label
            for="sharedKey"
            class="text-color text-base font-medium"
            >Shared Key *</label
          >
          <PrimePassword
            id="sharedKey"
            v-model="sharedKey"
            type="text"
            placeholder="OiA9AdGr4As5Iujg5FAHsTWfawxOD4"
            class="flex flex-col w-full"
            :class="{ 'p-invalid': sharedKeyError }"
            :feedback="false"
            toggleMask
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Shared Key of the Workspace.
          </small>
          <small
            id="shared-key-help"
            class="p-error"
            >{{ sharedKeyError }}</small
          >
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Time Generated Field"
            name="generatedField"
            :value="generatedField"
            description="Specifies how long it’ll take for the log to be available after collection. Uses
            ingestion time if not specified."
            placeholder="myCustomTimeField"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Workspace ID *"
            name="workspaceID"
            :value="workspaceID"
            description="ID of the Workspace."
            placeholder="kik73154-0426-464c-aij3-eg6d24u87c50"
          />
        </div>
      </div>

      <div
        id="azure_blob_storage"
        class="flex flex-col gap-8 max-md:gap-6"
        v-if="endpoint === 'azure_blob_storage'"
      >
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Storage Account *"
            name="storageAccount"
            :value="storageAccount"
            description="Name of the storage account."
            placeholder="mystorageaccount"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Container Name *"
            name="containerName"
            :value="containerName"
            description="Name of the container."
            placeholder="mycontainer"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Blob SAS Token *"
            name="blobToken"
            :value="blobToken"
            description="Token generated by Blob Storage. It should have create, read, write, and list accesses granted."
            placeholder="sp=oiuwdl&st=2022-04-14T18:05:08Z&se=2026-03-02T02:05:08Z&sv=2020-08-04&sr=c&sig=YUi0TBEt7XTlxXex4Jui%2Fc88h6qAgMmCY4XIXeMvxa0%3F"
          />
        </div>
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="Payload"
    description="Customize the essential information that'll be sent in the data."
    v-if="endpoint === 'standard'"
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Payload Format *"
          name="payloadFormat"
          :value="payloadFormat"
          description="The format that payload will be sent. The $dataset variable will be replaced by all logs already with the log line separator applied."
          placeholder="$dataset"
        />
      </div>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Payload Log Line Separator *"
          name="lineSeparator"
          :value="lineSeparator"
          :description="placeholderLineSeparator"
        />
      </div>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldNumber
          label="Payload Max Size"
          name="maxSize"
          :value="maxSize"
          description="Customizable maximum size of data packets in bytes. Accepts values starting from 1000000."
          placeholder="1000000"
          :useGrouping="false"
        />
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal title="Status">
    <template #inputs>
      <div class="flex flex-col w-full gap-2">
        <FieldSwitchBlock
          nameField="status"
          name="status"
          auto
          :isCard="false"
          title="Active"
        />
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'

  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldNumber from '@/templates/form-fields-inputs/fieldNumber.vue'
  import FieldTextArea from '@/templates/form-fields-inputs/fieldTextArea.vue'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown.vue'

  import ButtonPrimer from 'primevue/button'
  import InlineMessage from 'primevue/inlinemessage'
  import InputSwitch from 'primevue/inputswitch'
  import InputText from 'primevue/inputtext'
  import PrimePassword from 'primevue/password'
  import PickList from 'primevue/picklist'
  import RadioButton from 'primevue/radiobutton'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import { useField } from 'vee-validate'
  import { computed, onMounted, ref, watch } from 'vue'
  import { useRoute } from 'vue-router'

  import { useAccountStore } from '@/stores/account'

  const props = defineProps({
    listDataStreamTemplateService: {
      type: Function,
      required: true
    },
    listDataStreamDomainsService: {
      type: Function,
      required: true
    },
    resetForm: {
      type: Function,
      required: false
    }
  })

  const route = useRoute()

  // Variables
  const listDataSources = ref([
    { label: 'Activity History', value: 'rtm_activity' },
    { label: 'Edge Applications', value: 'http' },
    { label: 'Edge Functions', value: 'cells_console' },
    { label: 'WAF Events', value: 'waf' }
  ])
  const listEndpoint = ref([
    { label: 'Standard HTTP/HTTPS POST', value: 'standard' },
    { label: 'Apache Kafka', value: 'kafka' },
    { label: 'Simple Storage Service (S3)', value: 's3' },
    { label: 'Google BigQuery', value: 'big_query' },
    { label: 'Elasticsearch', value: 'elasticsearch' },
    { label: 'Splunk', value: 'splunk' },
    { label: 'AWS Kinesis Data Firehose', value: 'aws_kinesis_firehose' },
    { label: 'Datadog', value: 'datadog' },
    { label: 'IBM QRadar', value: 'qradar' },
    { label: 'Azure Monitor', value: 'azure_monitor' },
    { label: 'Azure Blob Storage', value: 'azure_blob_storage' }
  ])
  const listContentType = ref([
    { label: 'plain/text', value: 'plain/text' },
    { label: 'application/gzip', value: 'application/gzip' }
  ])

  // Campos do formulário
  useField('status')
  const { value: name } = useField('name')
  const { value: dataSource } = useField('dataSource')
  const { value: dataSet } = useField('dataSet')
  const { value: template } = useField('template')
  const { value: domainOption } = useField('domainOption')
  const { value: domains } = useField('domains')
  const { value: endpoint } = useField('endpoint')
  const { value: hasSampling } = useField('hasSampling')
  const { value: samplingPercentage } = useField('samplingPercentage')
  // standard
  const { value: endpointUrl } = useField('endpointUrl')
  const { value: headers } = useField('headers')
  const { value: maxSize } = useField('maxSize')
  const { value: lineSeparator } = useField('lineSeparator')
  const { value: payloadFormat } = useField('payloadFormat')

  // kafka
  const { value: bootstrapServers } = useField('bootstrapServers')
  const { value: kafkaTopic } = useField('kafkaTopic')
  const { value: useTls, errorMessage: useTlsError } = useField('useTls')

  // QRadar
  const { value: QRadarUrl } = useField('QRadarUrl')

  // s3
  const { value: host } = useField('host')
  const { value: bucket } = useField('bucket')
  const { value: region } = useField('region')
  const { value: accessKey, errorMessage: accessKeyError } = useField('accessKey')
  const { value: secretKey, errorMessage: secretKeyError } = useField('secretKey')
  const { value: objectKey, errorMessage: objectKeyError } = useField('objectKey')
  const { value: contentType, errorMessage: contentTypeError } = useField('contentType')

  // google big query
  const { value: projectID } = useField('projectID')
  const { value: datasetID } = useField('datasetID')
  const { value: tableID } = useField('tableID')
  const { value: serviceAccountKey, errorMessage: serviceAccountKeyError } =
    useField('serviceAccountKey')

  // elasticsearch
  const { value: elasticsearchUrl } = useField('elasticsearchUrl')
  const { value: apiKey } = useField('apiKey')

  // splunk
  const { value: splunkUrl } = useField('splunkUrl')
  const { value: splunkApiKey } = useField('splunkApiKey')

  // aws_kinesis_firehose
  const { value: streamName } = useField('streamName')
  const { value: awsRegion } = useField('awsRegion')
  const { value: awsAccessKey, errorMessage: awsAccessKeyError } = useField('awsAccessKey')
  const { value: awsSecretKey, errorMessage: awsSecretKeyError } = useField('awsSecretKey')

  // azure_monitor
  const { value: sharedKey, errorMessage: sharedKeyError } = useField('sharedKey')
  const { value: logType } = useField('logType')
  const { value: generatedField } = useField('generatedField')
  const { value: workspaceID } = useField('workspaceID')

  // datadog
  const { value: datadogUrl } = useField('datadogUrl')
  const { value: datadogApiKey } = useField('datadogApiKey')

  // azure_blob_storage
  const { value: storageAccount } = useField('storageAccount')
  const { value: containerName } = useField('containerName')
  const { value: blobToken } = useField('blobToken')

  const listTemplates = ref([])

  const loaderDataStreamTemplates = async () => {
    const templates = await props.listDataStreamTemplateService()
    listTemplates.value = templates

    const hasFirstTemplates = listTemplates?.value[0]?.value
    if (hasFirstTemplates) {
      const firstTemplateValue = listTemplates.value[0].value
      return firstTemplateValue
    }
    return ''
  }

  const loaderDataStreamDomains = async () => {
    const domainResponse = await props.listDataStreamDomainsService()
    return [domainResponse, []]
  }

  const addHeader = () => {
    headers.value.push({ value: '', deleted: true })
  }

  const removeHeader = (index) => {
    headers.value.splice(index, 1)
  }

  const insertDataSet = (templateID, isFirstRender) => {
    const index = listTemplates.value.map((el) => el.value).indexOf(templateID)
    try {
      if (templateID === 'CUSTOM_TEMPLATE' && !isFirstRender) {
        dataSet.value = ''
      } else {
        const dataSetJSON = JSON.parse(listTemplates.value[index].template)
        dataSet.value = JSON.stringify(dataSetJSON, null, '\t')
      }
    } catch (exception) {
      if (!dataSet.value || templateID !== 'CUSTOM_TEMPLATE') {
        dataSet.value = listTemplates.value[index].template
      }
    }
  }

  // Using the store
  const store = useAccountStore()

  const placeholderLineSeparator = computed(() => {
    const text = '"\\n"'
    return `Character that'll be used at the end of each log line. The ${text}  escape sequence breaks values into different lines in NDJSON format.`
  })

  const theme = computed(() => {
    return store.currentTheme === 'light' ? 'vs' : 'vs-dark'
  })

  const DEFAULT_MONACO_OPTIONS = {
    minimap: { enabled: false },
    wordWrap: 'on',
    tabSize: 2,
    formatOnPaste: true
  }
  const dataSetMonacoOptions = ref({ ...DEFAULT_MONACO_OPTIONS })
  const serviceAccountMonacoOptions = ref({ ...DEFAULT_MONACO_OPTIONS })

  watch(
    () => template.value,
    (newValue, oldValue) => {
      const templateID = newValue
      const isFirstRender = !oldValue
      if (templateID) insertDataSet(templateID, isFirstRender)

      const isReadOnlyIfCustomTemplate = templateID !== 'CUSTOM_TEMPLATE'
      dataSetMonacoOptions.value.readOnly = isReadOnlyIfCustomTemplate
    }
  )

  watch(
    () => domainOption.value,
    (option) => {
      if (option === '1') {
        if (domains.value[1] && domains.value[1].length > 0) {
          domains.value[1].forEach((element) => {
            domains.value[0].push(element)
          })
          domains.value[1] = []
        }
      }
    }
  )

  const initializeFormValues = async () => {
    const domains = await loaderDataStreamDomains()
    const template = await loaderDataStreamTemplates()

    if (props.resetForm) {
      const initialValues = {
        name: name.value,
        dataSource: 'http',
        template: template,
        dataSet: '',
        domainOption: '1',
        domains: domains,
        endpoint: 'standard',
        status: true,
        hasSampling: false,
        samplingPercentage: 0,

        // standard
        endpointUrl: '',
        headers: [{ value: '', deleted: false }],
        maxSize: 1000000,
        lineSeparator: '\\n',
        payloadFormat: '$dataset',

        // Kafka
        bootstrapServers: '',
        kafkaTopic: '',
        useTls: false,

        // s3
        host: '',
        bucket: '',
        region: '',
        accessKey: '',
        secretKey: '',
        objectKey: '',
        contentType: 'plain/text',

        // google big query
        projectID: '',
        datasetID: '',
        tableID: '',
        serviceAccountKey: '',

        // elasticsearch
        elasticsearchUrl: '',
        apiKey: '',

        // splunk
        splunkUrl: '',
        splunkApiKey: '',

        // aws_kinesis_firehose
        streamName: '',
        awsRegion: '',
        awsAccessKey: '',
        awsSecretKey: '',

        // datadog
        datadogUrl: '',
        datadogApiKey: '',

        // QRadar
        QRadarUrl: '',

        // azure_monitor
        logType: '',
        sharedKey: '',
        generatedField: '',
        workspaceID: '',

        // azure_blob_storage
        storageAccount: '',
        containerName: '',
        blobToken: ''
      }

      props.resetForm({ values: initialValues })
    }
  }

  const domainsRadioOptions = [
    {
      title: 'All Current and Future Domains',
      inputValue: '1',
      subtitle:
        'By selecting the All Current and Future Domains option, you can activate the Sampling option.'
    },
    {
      title: 'Filter Domains',
      inputValue: '0'
    }
  ]

  const setDefaultValuesWhenChangeTheEndpointInEdit = (isFirstRender) => {
    if (route.name === 'edit-data-stream' && !isFirstRender) {
      if (endpoint.value === 'standard') {
        maxSize.value = 1000000
        lineSeparator.value = '\\n'
        payloadFormat.value = '$dataset'
        headers.value = [{ value: '', deleted: false }]
      }

      if (endpoint.value === 's3') {
        contentType.value = 'plain/text'
      }
    }
  }

  // eslint-disable-next-line id-length
  watch(endpoint, (_, oldValue) => {
    const isFirstRender = !oldValue
    setDefaultValuesWhenChangeTheEndpointInEdit(isFirstRender)
  })

  onMounted(() => {
    initializeFormValues()
  })
</script>
