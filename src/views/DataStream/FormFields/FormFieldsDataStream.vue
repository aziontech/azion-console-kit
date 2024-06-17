<template>
  <FormHorizontal
    title="General"
    description="Create a stream to feed your data platforms with logs from your applications."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="name"
          class="text-color text-base font-medium"
          >Name *</label
        >
        <InputText
          v-model="name"
          type="text"
          placeholder="My stream"
          :class="{ 'p-invalid': nameError }"
        />
        <small class="text-xs text-color-secondary font-normal leading-5">
          Give a unique and descriptive name to identify the data stream.</small
        >
        <small
          id="name-help"
          class="p-error"
          >{{ nameError }}</small
        >
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
          <label
            for="dataSource"
            class="text-color text-base font-medium"
            >Source *</label
          >
          <Dropdown
            appendTo="self"
            :class="{ 'p-invalid': dataSourceError }"
            v-model="dataSource"
            :options="listDataSources"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Represents the data source the data will be collected from.
          </small>
        </div>

        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <label
            for="template"
            class="text-color text-base font-medium"
            >Template *</label
          >
          <Dropdown
            appendTo="self"
            :class="{ 'p-invalid': templateError }"
            v-model="template"
            :options="listTemplates"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Represents a preset of variables for specific sources or an open template to choose
            variables.
          </small>
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
          :options="optionsMonacoEditor"
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
          <label
            for="samplingPercentage"
            class="text-color text-base font-medium"
            >Sampling Percentage (%)</label
          >
          <InputNumber
            v-model="samplingPercentage"
            showButtons
            :min="0"
            :max="100"
            :class="{ 'p-invalid': samplingPercentageError }"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Percentage value received in return of the total data related to all domains.
          </small>
          <small
            v-if="samplingPercentageError"
            class="p-error"
            >{{ samplingPercentageError }}</small
          >
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
        <label
          for="id"
          class="text-color text-base font-medium"
          >Connector *</label
        >
        <Dropdown
          appendTo="self"
          :class="{ 'p-invalid': templateError }"
          v-model="endpoint"
          :options="listEndpoint"
          optionLabel="label"
          optionValue="value"
          class="w-full"
        />
        <small class="text-xs text-color-secondary font-normal leading-5">
          Each option represents a different platform and requires different values.
        </small>
      </div>

      <!-- Specific Sections for Different Endpoints -->
      <div
        id="standard"
        class="flex flex-col gap-8 max-md:gap-6"
        v-if="endpoint === 'standard'"
      >
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label
            for="endpointURL"
            class="text-color text-base font-medium"
            >URL *</label
          >
          <InputText
            v-model="endpointUrl"
            type="text"
            id="endpointURL"
            placeholder="https://app.domain.com/"
            :class="{ 'p-invalid': endpointUrlError }"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Specific URL that'll receive the collected data.
          </small>
          <small
            id="endpoint-url-help"
            class="p-error"
            >{{ endpointUrlError }}</small
          >
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
          <label
            for="bootstrapSevers"
            class="text-color text-base font-medium"
            >Bootstrap Servers *</label
          >
          <TextArea
            v-model="bootstrapServers"
            placeholder="host1:port1,host2:port2,..."
            :class="{ 'p-invalid': bootstrapServersError }"
            rows="5"
            cols="30"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            List of hosts and ports in a Kafka cluster. Separate items by comma and no space.
          </small>
          <small
            id="bootstrap-servers-help"
            class="p-error"
            >{{ bootstrapServersError }}</small
          >
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label
            for="kafkaTopic"
            class="text-color text-base font-medium"
            >Kafka Topic *</label
          >
          <InputText
            v-model="kafkaTopic"
            id="kafkaTopic"
            placeholder="analytics.fct.pageviews.0"
            type="text"
            :class="{ 'p-invalid': kafkaTopicError }"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Name of the topic in a Kafka cluster.
          </small>
          <small
            id="kafka-topic-help"
            class="p-error"
            >{{ kafkaTopicError }}</small
          >
        </div>

        <div class="flex sm:max-w-lg w-full gap-2 items-top">
          <InputSwitch
            v-model="tlsOption"
            id="tlsOption"
            class="flex-shrink-0 flex-grow"
            :class="{ 'p-invalid': tlsOptionError }"
          />
          <div class="flex flex-col gap-1">
            <label
              for="tlsOption"
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
          <label
            for="hostURL"
            class="text-color text-base font-medium"
            >URL *</label
          >
          <InputText
            v-model="host"
            type="text"
            placeholder="https://myownhost.s3.us-east-1.myprovider.com"
            :class="{ 'p-invalid': hostError }"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Specific URL that'll receive the collected data. Accepts all providers that work with an
            S3 protocol.
          </small>
          <small
            id="host-help"
            class="p-error"
            >{{ hostError }}</small
          >
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label
            for="bucketName"
            class="text-color text-base font-medium"
            >Bucket Name *</label
          >
          <InputText
            v-model="bucket"
            type="text"
            placeholder="mys3bucket"
            :class="{ 'p-invalid': bucketError }"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Name of the bucket to which the object will be sent.
          </small>
          <small
            id="bucket-help"
            class="p-error"
            >{{ bucketError }}</small
          >
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label
            for="region"
            class="text-color text-base font-medium"
            >Region *</label
          >
          <InputText
            v-model="region"
            type="text"
            placeholder="us-east-1"
            :class="{ 'p-invalid': regionError }"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Region in which your bucket is hosted.
          </small>
          <small
            id="region-help"
            class="p-error"
            >{{ regionError }}</small
          >
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
          <label
            for="projectID"
            class="text-color text-base font-medium"
            >Project ID *</label
          >
          <InputText
            v-model="projectID"
            type="text"
            placeholder="mycustomGBQproject01"
            :class="{ 'p-invalid': projectIDError }"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            ID of the project in Google Cloud.
          </small>

          <small
            id="project-id-help"
            class="p-error"
            >{{ projectIDError }}</small
          >
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label
            for="datasetID"
            class="text-color text-base font-medium"
            >Dataset ID *</label
          >
          <InputText
            v-model="datasetID"
            type="text"
            placeholder="myGBQdataset"
            :class="{ 'p-invalid': datasetIDError }"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Name of the dataset created on Google BigQuery. Case sensitive field.
          </small>
          <small
            id="dataset-id-help"
            class="p-error"
            >{{ datasetIDError }}</small
          >
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label
            for="tableID"
            class="text-color text-base font-medium"
            >Table ID *</label
          >
          <InputText
            v-model="tableID"
            type="text"
            placeholder="mypagaviewtable01"
            :class="{ 'p-invalid': tableIDError }"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Name of the table on Google BigQuery.
          </small>
          <small
            id="table-id-help"
            class="p-error"
            >{{ tableIDError }}</small
          >
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
            :options="optionsMonacoEditor"
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
          <label
            for="elasticSearchURL"
            class="text-color text-base font-medium"
            >URL *</label
          >
          <InputText
            v-model="elasticsearchUrl"
            type="text"
            placeholder="https://elasticsearch-domain.com/myindex"
            :class="{ 'p-invalid': elasticsearchUrlError }"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            URL address plus the Elasticsearch index that'll receive the collected data.
          </small>
          <small
            id="elastic-search-url-help"
            class="p-error"
            >{{ elasticsearchUrlError }}</small
          >
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label
            for="apiKey"
            class="text-color text-base font-medium"
            >API Key *</label
          >
          <TextArea
            id="apiKey"
            v-model="apiKey"
            placeholder="VuaCfGcBCdbkQm-e5aOx:ui2lp2axTNmsyakw9tvNnw"
            :class="{ 'p-invalid': apiKeyError }"
            rows="5"
            cols="30"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            API key used for Elasticsearch authorization in base64 encode format.
          </small>
          <small
            id="api-key-help"
            class="p-error"
            >{{ apiKeyError }}</small
          >
        </div>
      </div>

      <div
        id="splunk"
        class="flex flex-col gap-8 max-md:gap-6"
        v-if="endpoint === 'splunk'"
      >
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label
            for="splunkURL"
            class="text-color text-base font-medium"
            >URL *</label
          >
          <InputText
            v-model="splunkUrl"
            type="text"
            placeholder="https://inputs.splunk-client.splunkcloud.com:123456/services/collector"
            :class="{ 'p-invalid': splunkUrlError }"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            URL that'll receive the collected data. If you have an alternative index to point, add
            it at the end of the URL.
          </small>
          <small
            id="splunk-url-help"
            class="p-error"
            >{{ splunkUrlError }}</small
          >
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label
            for="splunkApiKey"
            class="text-color text-base font-medium"
            >API Key *</label
          >
          <TextArea
            v-model="splunkApiKey"
            placeholder="crfe25d2-23j8-48gf-a9ks-6b75w3ska674"
            :class="{ 'p-invalid': splunkApiKeyError }"
            rows="5"
            cols="30"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            HTTP Event Collector Token provided during the Splunk installation.
          </small>
          <small
            id="splunk-api-key-help"
            class="p-error"
            >{{ splunkApiKeyError }}</small
          >
        </div>
      </div>

      <div
        id="aws_kinesis_firehose"
        class="flex flex-col gap-8 max-md:gap-6"
        v-if="endpoint === 'aws_kinesis_firehose'"
      >
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label
            for="streamName"
            class="text-color text-base font-medium"
            >Stream Name *</label
          >
          <InputText
            v-model="streamName"
            type="text"
            placeholder="MyKDFConnector"
            :class="{ 'p-invalid': streamNameError }"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Delivery stream name.
          </small>
          <small
            id="stream-name-help"
            class="p-error"
            >{{ streamNameError }}</small
          >
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label
            for="region"
            class="text-color text-base font-medium"
            >Region *</label
          >
          <InputText
            v-model="awsRegion"
            type="text"
            placeholder="us-east-1"
            :class="{ 'p-invalid': awsRegionError }"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Region where the Amazon Kinesis instance is running.
          </small>
          <small
            id="aws-region-help"
            class="p-error"
            >{{ awsRegionError }}</small
          >
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
          <label
            for="datadogURL"
            class="text-color text-base font-medium"
            >URL *</label
          >
          <InputText
            v-model="datadogUrl"
            type="text"
            placeholder="https://http-intake.logs.datadoghq.com/v1/input"
            :class="{ 'p-invalid': datadogUrlError }"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            URL or URI of the Datadog endpoint.
          </small>
          <small
            id="datadog-url-help"
            class="p-error"
            >{{ datadogUrlError }}</small
          >
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label
            for="apiKey"
            class="text-color text-base font-medium"
            >API Key *</label
          >
          <TextArea
            id="datadogApiKey"
            v-model="datadogApiKey"
            placeholder="ij9076f1ujik17a81f938yhru5g713422"
            :class="{ 'p-invalid': datadogApiKeyError }"
            rows="5"
            cols="30"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            API key generated through the Datadog dashboard.
          </small>
          <small
            id="datadog-api-key-help"
            class="p-error"
            >{{ datadogApiKeyError }}</small
          >
        </div>
      </div>

      <div
        id="qradar"
        class="flex flex-col gap-8 max-md:gap-6"
        v-if="endpoint === 'qradar'"
      >
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label
            for="QRadarURL"
            class="text-color text-base font-medium"
            >URL *</label
          >
          <InputText
            v-model="QRadarUrl"
            type="text"
            placeholder="http://137.15.824.10:14440"
            :class="{ 'p-invalid': QRadarUrlError }"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Specific URL that'll receive the collected data.
          </small>
          <small
            id="qradar-url-help"
            class="p-error"
            >{{ QRadarUrlError }}</small
          >
        </div>
      </div>

      <div
        id="azure_monitor"
        class="flex flex-col gap-8 max-md:gap-6"
        v-if="endpoint === 'azure_monitor'"
      >
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label
            for="logType"
            class="text-color text-base font-medium"
            >Log Type *</label
          >
          <InputText
            id="logType"
            v-model="logType"
            type="text"
            placeholder="AzureMonitorTest"
            :class="{ 'p-invalid': logTypeError }"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Record type of the data that's being submitted. Accepts only letters, numbers, and the
            underscore (_) character, and it can't exceed 100 characters.
          </small>
          <small
            id="log-type-help"
            class="p-error"
            >{{ logTypeError }}</small
          >
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
          <label
            for="timeGeneratedField"
            class="text-color text-base font-medium"
            >Time Generated Field</label
          >
          <InputText
            id="timeGeneratedField"
            v-model="generatedField"
            placeholder="myCustomTimeField"
            type="text"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Specifies how long it’ll take for the log to be available after collection. Uses
            ingestion time if not specified.
          </small>
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label
            for="workspaceID"
            class="text-color text-base font-medium"
            >Workspace ID *</label
          >
          <InputText
            id="workspaceID"
            v-model="workspaceID"
            type="text"
            placeholder="kik73154-0426-464c-aij3-eg6d24u87c50"
            :class="{ 'p-invalid': workspaceIDError }"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            ID of the Workspace.
          </small>
          <small
            id="workspace-id-help"
            class="p-error"
            >{{ workspaceIDError }}</small
          >
        </div>
      </div>

      <div
        id="azure_blob_storage"
        class="flex flex-col gap-8 max-md:gap-6"
        v-if="endpoint === 'azure_blob_storage'"
      >
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label
            for="storageAccount"
            class="text-color text-base font-medium"
            >Storage Account *</label
          >
          <InputText
            id="storageAccount"
            v-model="storageAccount"
            type="text"
            placeholder="mystorageaccount"
            :class="{ 'p-invalid': storageAccountError }"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Name of the storage account.
          </small>
          <small
            id="storage-account-help"
            class="p-error"
            >{{ storageAccountError }}</small
          >
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label
            for="containerName"
            class="text-color text-base font-medium"
            >Container Name *</label
          >
          <InputText
            id="containerName"
            v-model="containerName"
            type="text"
            placeholder="mycontainer"
            :class="{ 'p-invalid': containerNameError }"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Name of the container.
          </small>
          <small
            id="container-name-help"
            class="p-error"
            >{{ containerNameError }}</small
          >
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label
            for="blobToken"
            class="text-color text-base font-medium"
            >Blob SAS Token *</label
          >
          <InputText
            id="blobToken"
            v-model="blobToken"
            type="text"
            placeholder="sp=oiuwdl&st=2022-04-14T18:05:08Z&se=2026-03-02T02:05:08Z&sv=2020-08-04&sr=c&sig=YUi0TBEt7XTlxXex4Jui%2Fc88h6qAgMmCY4XIXeMvxa0%3F"
            :class="{ 'p-invalid': blobTokenError }"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Token generated by Blob Storage. It should have create, read, write, and list accesses
            granted.
          </small>
          <small
            id="blob-token-help"
            class="p-error"
            >{{ blobTokenError }}</small
          >
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
        <label
          for="payloadFormat"
          class="text-color text-base font-medium"
          >Payload Format *</label
        >
        <InputText
          v-model="payloadFormat"
          type="text"
          placeholder="$dataset"
          :class="{ 'p-invalid': payloadFormatError }"
        />
        <small class="text-color-secondary text-xs font-normal leading-tight">
          Character that'll be used at the end of each log line. The "\n" escape sequence breaks
          values into different lines in NDJSON format.
        </small>
        <small
          id="data-set-help"
          class="p-error"
          >{{ payloadFormatError }}</small
        >
      </div>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="lineSeparator"
          class="text-color text-base font-medium"
          >Payload Log Line Separator *</label
        >
        <InputText
          v-model="lineSeparator"
          type="text"
          :class="{ 'p-invalid': lineSeparatorError }"
        />
        <small class="text-color-secondary text-xs font-normal leading-tight">
          The format that payload will be sent. The $dataset variable will be replaced by all logs
          already with the log line separator applied.
        </small>
        <small
          id="max-size-help"
          class="p-error"
          >{{ lineSeparatorError }}</small
        >
      </div>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="maxSize"
          class="text-color text-base font-medium"
          >Payload Max Size</label
        >
        <InputNumber
          v-model="maxSize"
          placeholder="1000000"
          :useGrouping="false"
        />
        <small class="text-color-secondary text-xs font-normal leading-tight">
          Customizable maximum size of data packets in bytes. Accepts values starting from 1000000.
        </small>
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

  import ButtonPrimer from 'primevue/button'
  import Dropdown from 'primevue/dropdown'
  import InlineMessage from 'primevue/inlinemessage'
  import InputNumber from 'primevue/inputnumber'
  import InputSwitch from 'primevue/inputswitch'
  import InputText from 'primevue/inputtext'
  import PrimePassword from 'primevue/password'
  import PickList from 'primevue/picklist'
  import RadioButton from 'primevue/radiobutton'
  import TextArea from 'primevue/textarea'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import { useField } from 'vee-validate'
  import { computed, onMounted, ref, watch } from 'vue'

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
  const { value: name, errorMessage: nameError } = useField('name')
  const { value: dataSource, errorMessage: dataSourceError } = useField('dataSource')
  const { value: dataSet } = useField('dataSet')
  const { value: template, errorMessage: templateError } = useField('template')
  const { value: domainOption } = useField('domainOption')
  const { value: domains } = useField('domains')
  const { value: endpoint } = useField('endpoint')
  const { value: hasSampling } = useField('hasSampling')
  const { value: samplingPercentage, errorMessage: samplingPercentageError } =
    useField('samplingPercentage')

  // standard
  const { value: endpointUrl, errorMessage: endpointUrlError } = useField('endpointUrl')
  const { value: headers } = useField('headers')
  const { value: maxSize } = useField('maxSize')
  const { value: lineSeparator, errorMessage: lineSeparatorError } = useField('lineSeparator')
  const { value: payloadFormat, errorMessage: payloadFormatError } = useField('payloadFormat')

  // kafka
  const { value: bootstrapServers, errorMessage: bootstrapServersError } =
    useField('bootstrapServers')
  const { value: kafkaTopic, errorMessage: kafkaTopicError } = useField('kafkaTopic')
  const { value: tlsOption, errorMessage: tlsOptionError } = useField('tlsOption')

  // s3
  const { value: host, errorMessage: hostError } = useField('host')
  const { value: bucket, errorMessage: bucketError } = useField('bucket')
  const { value: region, errorMessage: regionError } = useField('region')
  const { value: accessKey, errorMessage: accessKeyError } = useField('accessKey')
  const { value: secretKey, errorMessage: secretKeyError } = useField('secretKey')
  const { value: objectKey, errorMessage: objectKeyError } = useField('objectKey')
  const { value: contentType, errorMessage: contentTypeError } = useField('contentType')

  // google big query
  const { value: projectID, errorMessage: projectIDError } = useField('projectID')
  const { value: datasetID, errorMessage: datasetIDError } = useField('datasetID')
  const { value: tableID, errorMessage: tableIDError } = useField('tableID')
  const { value: serviceAccountKey, errorMessage: serviceAccountKeyError } =
    useField('serviceAccountKey')

  // elasticsearch
  const { value: elasticsearchUrl, errorMessage: elasticsearchUrlError } =
    useField('elasticsearchUrl')
  const { value: apiKey, errorMessage: apiKeyError } = useField('apiKey')

  // splunk
  const { value: splunkUrl, errorMessage: splunkUrlError } = useField('splunkUrl')
  const { value: splunkApiKey, errorMessage: splunkApiKeyError } = useField('splunkApiKey')

  // aws_kinesis_firehose
  const { value: streamName, errorMessage: streamNameError } = useField('streamName')
  const { value: awsRegion, errorMessage: awsRegionError } = useField('awsRegion')
  const { value: awsAccessKey, errorMessage: awsAccessKeyError } = useField('awsAccessKey')
  const { value: awsSecretKey, errorMessage: awsSecretKeyError } = useField('awsSecretKey')

  // datadog
  const { value: datadogUrl, errorMessage: datadogUrlError } = useField('datadogUrl')
  const { value: datadogApiKey, errorMessage: datadogApiKeyError } = useField('datadogApiKey')

  // QRadar
  const { value: QRadarUrl, errorMessage: QRadarUrlError } = useField('QRadarUrl')

  // azure_monitor
  const { value: logType, errorMessage: logTypeError } = useField('logType')
  const { value: sharedKey, errorMessage: sharedKeyError } = useField('sharedKey')
  const { value: generatedField } = useField('generatedField')
  const { value: workspaceID, errorMessage: workspaceIDError } = useField('workspaceID')

  // azure_blob_storage
  const { value: storageAccount, errorMessage: storageAccountError } = useField('storageAccount')
  const { value: containerName, errorMessage: containerNameError } = useField('containerName')
  const { value: blobToken, errorMessage: blobTokenError } = useField('blobToken')

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

  const insertDataSet = (templateID) => {
    const index = listTemplates.value.map((el) => el.value).indexOf(templateID)
    try {
      if (props.resetForm) {
        const dataSetJSON = JSON.parse(listTemplates.value[index].template)
        dataSet.value = JSON.stringify(dataSetJSON, null, '\t')
      }
    } catch (exception) {
      dataSet.value = listTemplates.value[index].template
    }
  }

  // Using the store
  const store = useAccountStore()

  const theme = computed(() => {
    return store.currentTheme === 'light' ? 'vs' : 'vs-dark'
  })

  const optionsMonacoEditor = computed(() => {
    return {
      minimap: { enabled: false },
      wordWrap: 'on',
      tabSize: 2,
      formatOnPaste: true
    }
  })

  watch(
    () => template.value,
    (templateID) => {
      if (templateID) insertDataSet(templateID)
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
        tlsOption: false,

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

  onMounted(() => {
    initializeFormValues()
  })
</script>
