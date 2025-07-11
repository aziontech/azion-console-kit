<template>
  <FormHorizontal
    title="Output"
    description="Define to which data platform your collected data will be sent to. All fields must be filled in with information provided by the third-party platform."
    data-testid="data-stream-form__section__output"
  >
    <template #inputs>
      <div class="flex flex-col w-full sm:max-w-xs gap-2">
        <FieldDropdown
          :disabled="hasNoPermissionToEditDataStream"
          label="Connector"
          required
          name="endpoint"
          :options="listEndpoint"
          optionLabel="label"
          optionValue="value"
          :value="endpoint"
          appendTo="self"
          description="Each option represents a different platform and requires different values."
          data-testid="data-stream-form__destination__connector-field"
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
            :disabled="hasNoPermissionToEditDataStream"
            label="URL"
            required
            description="Specific URL that'll receive the collected data."
            name="endpointUrl"
            :value="endpointUrl"
            placeholder="https://app.domain.com/"
            data-testid="data-stream-form__output__url-field"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            :disabled="hasNoPermissionToEditDataStream"
            label="Payload Format"
            required
            name="payloadFormat"
            :value="payloadFormat"
            description="The format that payload will be sent. The $dataset variable will be replaced by all logs already with the log line separator applied."
            placeholder="$dataset"
            data-testid="data-stream-form__destination__payload-format-field"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            :disabled="hasNoPermissionToEditDataStream"
            label="Payload Log Line Separator"
            required
            name="lineSeparator"
            :value="lineSeparator"
            :description="placeholderLineSeparator"
            data-testid="data-stream-form__destination__payload-line-separator-field"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldNumber
            :disabled="hasNoPermissionToEditDataStream"
            label="Payload Max Size"
            name="maxSize"
            :min="MIN_PAYLOAD_SIZE_IN_BYTES"
            :max="MAX_PAYLOAD_SIZE_IN_BYTES"
            :value="maxSize"
            description="Customizable maximum size of data packets in bytes. Accepts values starting from 1000000."
            placeholder="1000000"
            :useGrouping="false"
            data-testid="data-stream-form__destination__payload-max-size-field"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label
            for="customHeaders"
            class="text-color text-base font-medium"
            data-testid="data-stream-form__destination__headers-field__label"
            >Custom Headers</label
          >
          <div
            class="flex p-inputgroup"
            v-for="(header, index) in headers"
            :key="index"
          >
            <InputText
              :disabled="hasNoPermissionToEditDataStream"
              v-model="header.value"
              type="text"
              id="header-value"
              placeholder="header-name:value"
              data-testid="data-stream-form__destination__headers-field__input"
            />
            <ButtonPrimer
              :disabled="hasNoPermissionToEditDataStream"
              icon="pi pi-trash"
              size="small"
              outlined
              v-if="header.deleted"
              @click="removeHeader(index)"
              data-testid="data-stream-form__destination__headers-field__remove-button"
            />
          </div>

          <ButtonPrimer
            :disabled="hasNoPermissionToEditDataStream"
            outlined
            icon="pi pi-plus-circle"
            v-if="hasLessThanFive"
            iconPos="left"
            label="Header"
            size="small"
            class="w-fit"
            @click="addHeader()"
            data-testid="data-stream-form__destination__headers-field__add-button"
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
            :disabled="hasNoPermissionToEditDataStream"
            label="Bootstrap Servers"
            required
            name="bootstrapServers"
            rows="5"
            :value="bootstrapServers"
            placeholder="host1:port1,host2:port2,..."
            description="List of hosts and ports in a Kafka cluster. Separate items by comma and no space.."
            data-testid="data-stream-form__destination__bootstrap-servers-field"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            :disabled="hasNoPermissionToEditDataStream"
            label="Kafka Topic"
            required
            name="kafkaTopic"
            :value="kafkaTopic"
            description="Name of the topic in a Kafka cluster."
            placeholder="analytics.fct.pageviews.0"
            data-testid="data-stream-form__destination__kafka-topic-field"
          />
        </div>

        <div class="flex sm:max-w-lg w-full gap-2 items-top">
          <InputSwitch
            :disabled="hasNoPermissionToEditDataStream"
            v-model="useTls"
            id="useTls"
            class="flex-shrink-0 flex-grow"
            :class="{ 'p-invalid': useTlsError }"
            data-testid="data-stream-form__destination__use-tls-field"
          />
          <div class="flex flex-col gap-1">
            <label
              for="useTls"
              class="text-sm font-normal leading-tight"
              data-testid="data-stream-form__destination__use-tls-field__label"
              >Enable Transport Layer Security (TLS)</label
            >
            <small
              class="text-xs text-color-secondary font-normal leading-5"
              data-testid="data-stream-form__destination__use-tls-field__description"
            >
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
            :disabled="hasNoPermissionToEditDataStream"
            label="URL"
            required
            name="host"
            :value="host"
            description="Specific URL that'll receive the collected data. Accepts all providers that work with an S3 protocol."
            placeholder="https://myownhost.s3.us-east-1.myprovider.com"
            data-testid="data-stream-form__destination__url-field"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            :disabled="hasNoPermissionToEditDataStream"
            label="Bucket Name"
            required
            name="bucket"
            :value="bucket"
            description="Name of the bucket to which the object will be sent."
            placeholder="mys3bucket"
            data-testid="data-stream-form__destination__bucket-field"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            :disabled="hasNoPermissionToEditDataStream"
            label="Region"
            required
            name="region"
            :value="region"
            description="Region in which your bucket is hosted."
            placeholder="us-east-1"
            data-testid="data-stream-form__destination__region-field"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <LabelBlock
            for="accessKey"
            label="Access Key"
            data-testid="data-stream-form__destination__access-key-field__label"
            isRequired
          />
          <PrimePassword
            id="accessKey"
            v-model="accessKey"
            type="text"
            class="flex flex-col w-full"
            :class="{ 'p-invalid': accessKeyError }"
            :feedback="false"
            :disabled="hasNoPermissionToEditDataStream"
            toggleMask
            placeholder="ORIA5ZEH9MW4NL5OITY4"
            data-testid="data-stream-form__destination__access-key-field__input"
          >
            <template
              #showicon
              v-if="hasNoPermissionToEditDataStream"
            >
              <i class="pi pi-lock"></i>
            </template>
          </PrimePassword>
          <small
            class="text-xs text-color-secondary font-normal leading-5"
            data-testid="data-stream-form__destination__access-key-field__description"
          >
            Public key to access the bucket.
          </small>
          <small
            id="access-key-help"
            class="p-error"
            data-testid="data-stream-form__destination__access-key-field__error-message"
            >{{ accessKeyError }}</small
          >
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <LabelBlock
            for="secretKey"
            label="Secret Key"
            data-testid="data-stream-form__destination__secret-key-field__label"
            isRequired
          />
          <PrimePassword
            id="secretKey"
            v-model="secretKey"
            type="text"
            placeholder="+PLjkUWJyOLth3anuWXcLLVrMLeiiiThIokaPEiw"
            class="flex flex-col w-full"
            :class="{ 'p-invalid': secretKeyError }"
            :feedback="false"
            :disabled="hasNoPermissionToEditDataStream"
            toggleMask
            data-testid="data-stream-form__destination__secret-key-field__input"
          >
            <template
              #showicon
              v-if="hasNoPermissionToEditDataStream"
            >
              <i class="pi pi-lock"></i>
            </template>
          </PrimePassword>
          <small
            class="text-xs text-color-secondary font-normal leading-5"
            data-testid="data-stream-form__destination__secret-key-field__description"
          >
            Secret key to access the bucket.
          </small>
          <small
            id="secret-key-help"
            class="p-error"
            data-testid="data-stream-form__destination__secret-key-field__error-message"
            >{{ secretKeyError }}</small
          >
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label
            for="objectKeyPrefix"
            class="text-color text-base font-medium"
            data-testid="data-stream-form__destination__object-key-prefix-field__label"
            >Object Key Prefix</label
          >
          <PrimePassword
            id="objectKey"
            v-model="objectKey"
            type="text"
            placeholder="user/logs/"
            class="flex flex-col w-full"
            :class="{ 'p-invalid': objectKeyError }"
            :feedback="false"
            :disabled="hasNoPermissionToEditDataStream"
            toggleMask
            data-testid="data-stream-form__destination__object-key-prefix-field__input"
          >
            <template
              #showicon
              v-if="hasNoPermissionToEditDataStream"
            >
              <i class="pi pi-lock"></i>
            </template>
          </PrimePassword>
          <small
            class="text-xs text-color-secondary font-normal leading-5"
            data-testid="data-stream-form__destination__object-key-prefix-field__description"
          >
            The prefix for the name of your uploaded object. The name consists of the Prefix, the
            date and time the packets are sent in the YYYY/MM/DD/hh/mm/ format, and the UUID. <br />
            Example: user/logs/2024/10/12/06/24/37d66e78-c308-4006-9d4d-1c013ed89276.
          </small>
          <small
            id="object-key-help"
            class="p-error"
            data-testid="data-stream-form__destination__object-key-prefix-field__error-message"
            >{{ objectKeyError }}</small
          >
        </div>

        <div class="flex flex-col gap-2">
          <LabelBlock
            label="Content Type"
            isRequired
            data-testid="data-stream-form__destination__content-type-field__label"
          />
          <div class="flex flex-col gap-3">
            <div
              class="flex no-wrap gap-2 items-center"
              v-for="contentTypeItem of listContentType"
              :key="contentTypeItem.value"
            >
              <RadioButton
                :disabled="hasNoPermissionToEditDataStream"
                :class="{ 'p-invalid': contentTypeError }"
                v-model="contentType"
                inputId="contentType"
                :name="contentTypeItem.value"
                :value="contentTypeItem.value"
                data-testid="data-stream-form__destination__content-type-field__radio"
              />
              <label
                class="text-color text-sm font-normal leading-tight"
                data-testid="data-stream-form__destination__content-type-field__label"
              >
                {{ contentTypeItem.label }}
              </label>
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
            :disabled="hasNoPermissionToEditDataStream"
            label="Project ID"
            required
            name="projectID"
            :value="projectID"
            description="ID of the project in Google Cloud."
            placeholder="mycustomGBQproject01"
            data-testid="data-stream-form__destination__project-id-field"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            :disabled="hasNoPermissionToEditDataStream"
            label="Dataset ID"
            required
            name="datasetID"
            :value="datasetID"
            description="Name of the dataset created on Google BigQuery. Case sensitive field."
            placeholder="myGBQdataset"
            data-testid="data-stream-form__destination__dataset-id-field"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            :disabled="hasNoPermissionToEditDataStream"
            label="Table ID"
            required
            name="tableID"
            :value="tableID"
            description="Name of the table on Google BigQuery."
            placeholder="mypagaviewtable01"
            data-testid="data-stream-form__destination__table-id-field"
          />
        </div>

        <div class="flex flex-col w-full gap-2">
          <LabelBlock
            for="serviceAccountKey"
            label="Service Account Key"
            isRequired
            data-testid="data-stream-form__destination__service-account-key-field__label"
          />
          <vue-monaco-editor
            v-model:value="serviceAccountKey"
            language="json"
            :theme="theme"
            :options="serviceAccountMonacoOptions"
            class="min-h-[300px] surface-border border rounded-md overflow-hidden"
            data-testid="data-stream-form__destination__service-account-key-field__input"
            :readOnly="hasNoPermissionToEditDataStream"
          />
          <small
            class="text-xs text-color-secondary font-normal leading-5"
            data-testid="data-stream-form__destination__service-account-key-field__description"
          >
            JSON file provided by Google Cloud used to authenticate with Google services.
          </small>
          <small
            id="service-account-key-help"
            class="p-error"
            data-testid="data-stream-form__destination__service-account-key-field__error-message"
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
            :disabled="hasNoPermissionToEditDataStream"
            label="URL"
            required
            name="elasticsearchUrl"
            :value="elasticsearchUrl"
            description="URL address plus the Elasticsearch index that'll receive the collected data."
            placeholder="https://elasticsearch-domain.com/myindex"
            data-testid="data-stream-form__destination__elasticsearch-url-field"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldTextArea
            :disabled="hasNoPermissionToEditDataStream"
            label="Encoded API Key"
            required
            name="apiKey"
            :value="apiKey"
            rows="5"
            placeholder="VnVhQ2ZHY0JDZGJrUW0tZTVhT3g6dWkybHAyYXhUTm1zeWFrdzl0dk5udw=="
            description="Base64 key corresponding to the encoded value generated while creating the API Key in ElasticSearch."
            data-testid="data-stream-form__destination__api-key-field"
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
            :disabled="hasNoPermissionToEditDataStream"
            label="URL"
            required
            name="splunkUrl"
            :value="splunkUrl"
            description="URL that'll receive the collected data. If you have an alternative index to point, add it at the end of the URL."
            placeholder="https://inputs.splunk-client.splunkcloud.com:123456/services/collector"
            data-testid="data-stream-form__destination__splunk-url-field"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldTextArea
            :disabled="hasNoPermissionToEditDataStream"
            label="API Key"
            required
            name="splunkApiKey"
            :value="splunkApiKey"
            placeholder="crfe25d2-23j8-48gf-a9ks-6b75w3ska674"
            description="HTTP Event Collector Token provided during the Splunk installation."
            data-testid="data-stream-form__destination__splunk-api-key-field"
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
            :disabled="hasNoPermissionToEditDataStream"
            label="Stream Name"
            required
            name="streamName"
            :value="streamName"
            description="Delivery stream name."
            placeholder="MyKDFConnector"
            data-testid="data-stream-form__destination__kinesis-stream-name-field"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            :disabled="hasNoPermissionToEditDataStream"
            label="Region"
            required
            name="awsRegion"
            :value="awsRegion"
            description="Region where the Amazon Kinesis instance is running."
            placeholder="us-east-1"
            data-testid="data-stream-form__destination__kinesis-region-field"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <LabelBlock
            for="accessKey"
            label="Access Key"
            data-testid="data-stream-form__destination__kinesis-access-key-field__label"
            isRequired
          />
          <PrimePassword
            id="awsAccessKey"
            v-model="awsAccessKey"
            type="text"
            placeholder="ORIA5ZEH9MW4NL5OITY4"
            class="flex flex-col w-full"
            :class="{ 'p-invalid': awsAccessKeyError }"
            :feedback="false"
            toggleMask
            :disabled="hasNoPermissionToEditDataStream"
            data-testid="data-stream-form__destination__kinesis-access-key-field__input"
          >
            <template
              #showicon
              v-if="hasNoPermissionToEditDataStream"
            >
              <i class="pi pi-lock"></i>
            </template>
          </PrimePassword>

          <small
            class="text-xs text-color-secondary font-normal leading-5"
            data-testid="data-stream-form__destination__kinesis-access-key-field__description"
          >
            Public key to access the Data Firehose given by AWS.
          </small>
          <small
            id="aws-access-key-help"
            class="p-error"
            data-testid="data-stream-form__destination__kinesis-access-key-field__error"
            >{{ awsAccessKeyError }}</small
          >
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <LabelBlock
            for="accessKey"
            label="Secret Key"
            data-testid="data-stream-form__destination__kinesis-secret-key-field__label"
            isRequired
          />
          <PrimePassword
            id="awsSecretKey"
            v-model="awsSecretKey"
            type="text"
            placeholder="+PLjkUWJyOLth3anuWXcLLVrMLeiiiThIokaPEiw"
            class="flex flex-col w-full"
            :class="{ 'p-invalid': awsSecretKeyError }"
            :feedback="false"
            toggleMask
            :disabled="hasNoPermissionToEditDataStream"
            data-testid="data-stream-form__destination__kinesis-secret-key-field__input"
          >
            <template
              #showicon
              v-if="hasNoPermissionToEditDataStream"
            >
              <i class="pi pi-lock"></i>
            </template>
          </PrimePassword>
          <small
            class="text-xs text-color-secondary font-normal leading-5"
            data-testid="data-stream-form__destination__kinesis-secret-key-field__description"
          >
            Secret key to access the Data Firehose given by AWS.
          </small>
          <small
            id="aws-secret-key-help"
            class="p-error"
            data-testid="data-stream-form__destination__kinesis-secret-key-field__error"
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
            :disabled="hasNoPermissionToEditDataStream"
            label="URL"
            required
            name="datadogUrl"
            :value="datadogUrl"
            description="URL or URI of the Datadog endpoint."
            placeholder="https://http-intake.logs.datadoghq.com/v1/input"
            data-testid="data-stream-form__destination__datadog-url-field"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldTextArea
            :disabled="hasNoPermissionToEditDataStream"
            label="API Key"
            required
            name="datadogApiKey"
            :value="datadogApiKey"
            placeholder="ij9076f1ujik17a81f938yhru5g713422"
            description="API key generated through the Datadog dashboard."
            data-testid="data-stream-form__destination__datadog-api-key-field"
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
            :disabled="hasNoPermissionToEditDataStream"
            label="URL"
            required
            name="QRadarUrl"
            :value="QRadarUrl"
            description="Specific URL that'll receive the collected data."
            placeholder="http://137.15.824.10:14440"
            data-testid="data-stream-form__destination__qradar-url-field"
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
            :disabled="hasNoPermissionToEditDataStream"
            label="Log Type"
            required
            name="logType"
            :value="logType"
            description="Record type of the data that's being submitted. Accepts only letters, numbers, and the underscore (_) character, and it can't exceed 100 characters."
            placeholder="AzureMonitorTest"
            data-testid="data-stream-form__destination__azure-monitor-log-type-field"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <LabelBlock
            for="sharedKey"
            label="Shared Key"
            data-testid="data-stream-form__destination__azure-monitor-shared-key-field__label"
            isRequired
          />
          <PrimePassword
            id="sharedKey"
            v-model="sharedKey"
            type="text"
            placeholder="OiA9AdGr4As5Iujg5FAHsTWfawxOD4"
            class="flex flex-col w-full"
            :class="{ 'p-invalid': sharedKeyError }"
            :feedback="false"
            toggleMask
            :disabled="hasNoPermissionToEditDataStream"
            data-testid="data-stream-form__destination__azure-monitor-shared-key-field__input"
          >
            <template
              #showicon
              v-if="hasNoPermissionToEditDataStream"
            >
              <i class="pi pi-lock"></i>
            </template>
          </PrimePassword>
          <small
            class="text-xs text-color-secondary font-normal leading-5"
            data-testid="data-stream-form__destination__azure-monitor-shared-key-field__description"
          >
            Shared Key of the Workspace.
          </small>
          <small
            id="shared-key-help"
            class="p-error"
            data-testid="data-stream-form__destination__azure-monitor-shared-key-field__error-message"
            >{{ sharedKeyError }}</small
          >
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            :disabled="hasNoPermissionToEditDataStream"
            label="Time Generated Field"
            name="generatedField"
            :value="generatedField"
            description="Specifies how long it’ll take for the log to be available after collection. Uses
            ingestion time if not specified."
            placeholder="myCustomTimeField"
            data-testid="data-stream-form__destination__azure-monitor-generated-field"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            :disabled="hasNoPermissionToEditDataStream"
            label="Workspace ID"
            required
            name="workspaceID"
            :value="workspaceID"
            description="ID of the Workspace."
            placeholder="kik73154-0426-464c-aij3-eg6d24u87c50"
            data-testid="data-stream-form__destination__azure-monitor-workspace-id-field"
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
            :disabled="hasNoPermissionToEditDataStream"
            label="Storage Account"
            required
            name="storageAccount"
            :value="storageAccount"
            description="Name of the storage account."
            placeholder="mystorageaccount"
            data-testid="data-stream-form__destination__azure-blob-storage-storage-account-field"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            :disabled="hasNoPermissionToEditDataStream"
            label="Container Name"
            required
            name="containerName"
            :value="containerName"
            description="Name of the container."
            placeholder="mycontainer"
            data-testid="data-stream-form__destination__azure-blob-storage-container-name-field"
          />
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            :disabled="hasNoPermissionToEditDataStream"
            label="Blob SAS Token"
            required
            name="blobToken"
            :value="blobToken"
            description="Token generated by Blob Storage. It should have create, read, write, and list accesses granted."
            placeholder="sp=oiuwdl&st=2022-04-14T18:05:08Z&se=2026-03-02T02:05:08Z&sv=2020-08-04&sr=c&sig=YUi0TBEt7XTlxXex4Jui%2Fc88h6qAgMmCY4XIXeMvxa0%3F"
            data-testid="data-stream-form__destination__azure-blob-storage-blob-token-field"
          />
        </div>
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import { MIN_PAYLOAD_SIZE_IN_BYTES, MAX_PAYLOAD_SIZE_IN_BYTES } from '@/utils/constants'
  import { computed, ref } from 'vue'
  import { useField } from 'vee-validate'
  import { useAccountStore } from '@/stores/account'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown.vue'
  import FieldText from '@/templates/form-fields-inputs/fieldText.vue'
  import FieldTextArea from '@/templates/form-fields-inputs/fieldTextArea.vue'
  import ButtonPrimer from 'primevue/button'
  import InputText from 'primevue/inputtext'
  import PrimePassword from 'primevue/password'
  import InputSwitch from 'primevue/inputswitch'
  import RadioButton from 'primevue/radiobutton'
  import LabelBlock from '@/templates/label-block'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'

  const store = useAccountStore()

  const { value: endpoint } = useField('endpoint')
  const { value: endpointUrl } = useField('endpointUrl')
  const { value: headers } = useField('headers')

  // Standard
  const { value: host } = useField('host')
  const { value: bucket } = useField('bucket')
  const { value: region } = useField('region')
  const { value: accessKey, errorMessage: accessKeyError } = useField('accessKey')
  const { value: secretKey, errorMessage: secretKeyError } = useField('secretKey')
  const { value: objectKey, errorMessage: objectKeyError } = useField('objectKey')
  const { value: contentType, errorMessage: contentTypeError } = useField('contentType')
  const { value: payloadFormat } = useField('payloadFormat')
  const { value: lineSeparator } = useField('lineSeparator')
  const { value: maxSize } = useField('maxSize')

  // Kafka
  const { value: bootstrapServers } = useField('bootstrapServers')
  const { value: kafkaTopic } = useField('kafkaTopic')
  const { value: useTls, errorMessage: useTlsError } = useField('useTls')

  // Google BigQuery
  const { value: projectID } = useField('projectID')
  const { value: datasetID } = useField('datasetID')
  const { value: tableID } = useField('tableID')
  const { value: serviceAccountKey, errorMessage: serviceAccountKeyError } =
    useField('serviceAccountKey')

  // Elasticsearch
  const { value: elasticsearchUrl } = useField('elasticsearchUrl')
  const { value: apiKey } = useField('apiKey')

  // Splunk
  const { value: splunkUrl } = useField('splunkUrl')
  const { value: splunkApiKey } = useField('splunkApiKey')

  // AWS Kinesis Firehose
  const { value: streamName } = useField('streamName')
  const { value: awsRegion } = useField('awsRegion')
  const { value: awsAccessKey, errorMessage: awsAccessKeyError } = useField('awsAccessKey')
  const { value: awsSecretKey, errorMessage: awsSecretKeyError } = useField('awsSecretKey')

  // Datadog
  const { value: datadogUrl } = useField('datadogUrl')
  const { value: datadogApiKey } = useField('datadogApiKey')

  // QRadar
  const { value: QRadarUrl } = useField('QRadarUrl')

  // Azure Monitor
  const { value: sharedKey, errorMessage: sharedKeyError } = useField('sharedKey')
  const { value: logType } = useField('logType')
  const { value: generatedField } = useField('generatedField')
  const { value: workspaceID } = useField('workspaceID')

  // Azure Blob Storage
  const { value: storageAccount } = useField('storageAccount')
  const { value: containerName } = useField('containerName')
  const { value: blobToken } = useField('blobToken')

  const hasNoPermissionToEditDataStream = computed(() => !store.hasPermissionToEditDataStream)

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

  const addHeader = () => {
    headers.value.push({ value: '', deleted: true })
  }

  const removeHeader = (index) => {
    headers.value.splice(index, 1)
  }

  const MAX_HEADER_COUNT = 5
  const hasLessThanFive = computed(() => {
    return headers?.value?.length < MAX_HEADER_COUNT
  })

  const listContentType = ref([
    { label: 'plain/text', value: 'plain/text' },
    { label: 'application/gzip', value: 'application/gzip' }
  ])

  const theme = computed(() => {
    return store.currentTheme === 'light' ? 'vs' : 'vs-dark'
  })

  const DEFAULT_MONACO_OPTIONS = {
    minimap: { enabled: false },
    wordWrap: 'on',
    tabSize: 2,
    formatOnPaste: true
  }
  const serviceAccountMonacoOptions = ref({ ...DEFAULT_MONACO_OPTIONS })

  const placeholderLineSeparator = computed(() => {
    const text = '"\\n"'
    return `Character that'll be used at the end of each log line. The ${text} escape sequence breaks values into different lines in NDJSON format.`
  })
</script>
