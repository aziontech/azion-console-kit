<template>
  <FormHorizontal
    title="General"
    description="description"
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
          :class="{ 'p-invalid': nameError }"
        />
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
    description="Description"
  >
    <template #inputs>
      <div class="flex flex-wrap gap-6">
        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <label
            for="dataSource"
            class="text-color text-base font-medium"
            >Data Source *</label
          >
          <Dropdown
            :class="{ 'p-invalid': dataSourceError }"
            v-model="dataSource"
            :options="listDataSources"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
          <small class="text-color-secondary text-xs font-normal leading-tight">
            Data Source is the Azion Platform that generates the events from where you want to
            collect data.
          </small>
        </div>

        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <label
            for="template"
            class="text-color text-base font-medium"
            >Template *</label
          >
          <Dropdown
            :class="{ 'p-invalid': templateError }"
            v-model="template"
            :options="listTemplates"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
          <small class="text-color-secondary text-xs font-normal leading-tight">
            You can use a preset of data, or you can customize the format by choosing the Custom
            Template.
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
          class="min-h-[100px] surface-border border rounded-sm overflow-hidden"
        />
        <small class="text-color-secondary text-xs font-normal leading-tight">
          Data Set is a format chosen to send the data to your endpoint. It must be a valid JSON
          format. The requests are separated from each other by \n character.
        </small>
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="Domains"
    description="Description"
  >
    <template #inputs>
      <div class="flex flex-col gap-2">
        <label class="text-color text-sm font-medium leading-tight">Option</label>
        <div class="flex flex-col gap-3">
          <div class="flex no-wrap gap-2 items-center">
            <RadioButton
              v-model="domainOption"
              inputId="all-domain"
              name="all domain"
              value="1"
            />
            <label class="text-color text-sm font-normal leading-tight"
              >All domains and upcoming</label
            >
          </div>
          <div class="flex no-wrap gap-2 items-center">
            <RadioButton
              v-model="domainOption"
              inputId="filter-domain"
              name="filter domain"
              value="0"
            />
            <label class="text-color text-sm font-normal leading-tight">Filter Domains </label>
          </div>
          <small class="text-color-secondary text-xs font-normal leading-tight"
            >In case you select the All Domains option, you can activate the Sampling option</small
          >
        </div>
      </div>

      <div
        v-if="domainOption === '0'"
        class="flex flex-col gap-2"
      >
        <label
          for="domains"
          class="text-color text-base font-medium"
          >Domains</label
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

        <small class="text-color-secondary text-sm font-normal leading-tight">
          Hold <code>command</code> or <code>ctrl</code> to select multiple items.
        </small>
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    v-if="domainOption === '1'"
    title="Sampling"
    description="Enable this option to reduce costs of data collection and analysis"
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-8">
        <div
          class="flex gap-6 md:align-items-center max-sm:flex-col max-sm:align-items-baseline max-sm:gap-3"
        >
          <span class="w-full flex flex-col gap-2 pb-3 pt-2">
            <div class="flex gap-1">
              <InputSwitch
                v-model="hasSampling"
                inputId="sampling"
              />
              <label
                class="text-color text-sm font-normal leading-5"
                for="sampling"
                >Active</label
              >
            </div>
            <div class="flex-col gap-1 pl-10">
              <p class="text-color-secondary text-sm font-normal">
                Once enabled, you can only have one active data streaming in your account. If it's
                later disabled, the Add option will become available again on the creation page.
              </p>
            </div>
          </span>
        </div>
        <div
          class="flex flex-col sm:max-w-lg w-full gap-2"
          v-if="hasSampling"
        >
          <label
            for="samplingPercentage"
            class="text-color text-base font-medium"
            >Sampling Percentage(%)</label
          >
          <InputNumber
            v-model="samplingPercentage"
            showButtons
            :min="0"
            :max="100"
            :class="{ 'p-invalid': samplingPercentageError }"
          />
          <small class="text-color-secondary text-xs font-normal leading-tight">
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
          After activating and saving these settings, all other data streamings will become
          inactive.
        </InlineMessage>
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal title="Destination">
    <template #inputs>
      <div class="flex flex-col w-full sm:max-w-xs gap-2">
        <label
          for="id"
          class="text-color text-base font-medium"
          >Endpoint Type *</label
        >
        <Dropdown
          :class="{ 'p-invalid': templateError }"
          v-model="endpoint"
          :options="listEndpoint"
          optionLabel="label"
          optionValue="value"
          class="w-full"
        />
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
            >Endpoint URL *</label
          >
          <InputText
            v-model="endpointUrl"
            type="text"
            id="endpointURL"
            placeholder="https://app.domain.com/"
            :class="{ 'p-invalid': endpointUrlError }"
          />
          <small class="text-color-secondary text-xs font-normal leading-tight">
            The URL to receive the collected data from Data Streaming.
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
              placeholder="Value"
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
          <small class="text-color-secondary text-xs font-normal leading-tight">
            The list of host and port (comma-separated) from Kafka brokers.
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
            type="text"
            :class="{ 'p-invalid': kafkaTopicError }"
          />
          <small class="text-color-secondary text-xs font-normal leading-tight">
            The topic name from Kafka brokers.
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
              >Use Transport Layer Security (TLS)</label
            >
            <small class="text-color-secondary text-sm font-normal leading-tight">
              If you need secure logging, use Transport Layer Security (TLS). Make sure your server
              uses a trusted CA certificate.
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
            >Host URL *</label
          >
          <InputText
            v-model="host"
            type="text"
            :class="{ 'p-invalid': hostError }"
          />
          <small class="text-color-secondary text-sm font-normal leading-tight">
            The URL of your S3 host. You may connect with every provider that works with S3
            protocol, for example: AWS, Google Cloud Plataform, Azion, etc..
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
            :class="{ 'p-invalid': bucketError }"
          />
          <small class="text-color-secondary text-sm font-normal leading-tight">
            The name of your S3 bucket.
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
            :class="{ 'p-invalid': regionError }"
          />
          <small class="text-color-secondary text-sm font-normal leading-tight">
            The region of your S3 bucket.
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
          />
          <small class="text-color-secondary text-sm font-normal leading-tight">
            The access key of your S3 bucket.
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
            class="flex flex-col w-full"
            :class="{ 'p-invalid': secretKeyError }"
            :feedback="false"
            toggleMask
          />
          <small class="text-color-secondary text-sm font-normal leading-tight">
            The secret key of your S3 bucket.
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
            class="flex flex-col w-full"
            :class="{ 'p-invalid': objectKeyError }"
            :feedback="false"
            toggleMask
          />
          <small class="text-color-secondary text-sm font-normal leading-tight">
            The format of the object that will be created in your S3 bucket.
          </small>
          <small
            id="object-key-help"
            class="p-error"
            >{{ objectKeyError }}</small
          >
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-color text-sm font-medium leading-tight">Content Type</label>
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
            :class="{ 'p-invalid': projectIDError }"
          />
          <small class="text-color-secondary text-sm font-normal leading-tight">
            The ID of your project in Google Cloud.
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
            :class="{ 'p-invalid': datasetIDError }"
          />
          <small class="text-color-secondary text-sm font-normal leading-tight">
            The ID of your dataset created on Google BigQuery.
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
            :class="{ 'p-invalid': tableIDError }"
          />
          <small class="text-color-secondary text-sm font-normal leading-tight">
            The ID of your table that will receive the streamed data.
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
            class="min-h-[100px] surface-border border rounded-md overflow-hidden"
          />
          <small class="text-color-secondary text-sm font-normal leading-tight">
            The JSON file with the key that will be used to authenticate with Google services.
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
            >Elasticsearch URL *</label
          >
          <InputText
            v-model="elasticsearchUrl"
            type="text"
            placeholder="https://elasticsearch-domain.com/index"
            :class="{ 'p-invalid': elasticsearchUrlError }"
          />
          <small class="text-color-secondary text-sm font-normal leading-tight">
            The URL plus the index of the Elasticsearch to receive the collected data from Data
            Streaming.
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
            :class="{ 'p-invalid': apiKeyError }"
            rows="5"
            cols="30"
          />
          <small class="text-color-secondary text-sm font-normal leading-tight">
            The API Key in base64 used for Elasticsearch authorization.
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
            >Splunk URL *</label
          >
          <InputText
            v-model="splunkUrl"
            type="text"
            placeholder="https://inputs.splunk-client.splunkcloud.com:123456/services/collector"
            :class="{ 'p-invalid': splunkUrlError }"
          />
          <small class="text-color-secondary text-sm font-normal leading-tight">
            The URL that will receive the collected data from Data Streaming, if you have an
            alternative index to point, you can do at the end of the URL.
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
            :class="{ 'p-invalid': splunkApiKeyError }"
            rows="5"
            cols="30"
          />
          <small class="text-color-secondary text-sm font-normal leading-tight">
            The HTTP Event Collector Token, provided by your Splunk installation.
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
            :class="{ 'p-invalid': streamNameError }"
          />
          <small class="text-color-secondary text-sm font-normal leading-tight">
            The name of your delivery Kinesis Firehose stream.
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
            >Country / Region *</label
          >
          <InputText
            v-model="awsRegion"
            type="text"
            :class="{ 'p-invalid': awsRegionError }"
          />
          <small class="text-color-secondary text-sm font-normal leading-tight">
            The region of your S3 bucket.
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
            class="flex flex-col w-full"
            :class="{ 'p-invalid': awsAccessKeyError }"
            :feedback="false"
            toggleMask
          />
          <small class="text-color-secondary text-sm font-normal leading-tight">
            The access key of your Kinesis Firehose stream.
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
            class="flex flex-col w-full"
            :class="{ 'p-invalid': awsSecretKeyError }"
            :feedback="false"
            toggleMask
          />
          <small class="text-color-secondary text-sm font-normal leading-tight">
            The secret key of your Kinesis Firehose stream.
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
            >Datadog URL *</label
          >
          <InputText
            v-model="datadogUrl"
            type="text"
            placeholder="https://http-intake.logs.datadoghq.com/v1/input"
            :class="{ 'p-invalid': datadogUrlError }"
          />
          <small class="text-color-secondary text-sm font-normal leading-tight">
            The URI that will receive the collected data from Data Streaming.
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
            :class="{ 'p-invalid': datadogApiKeyError }"
            rows="5"
            cols="30"
          />
          <small class="text-color-secondary text-sm font-normal leading-tight">
            API Keys are generated through the Datadog panel and they're unique to your
            organization. An API Key is required by the Datadog agent to submit metrics and events
            to Datadog.
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
            >QRadar URL *</label
          >
          <InputText
            v-model="QRadarUrl"
            type="text"
            placeholder="https://qradar-trial-abcdef.qradar.ibmcloud.com:123456"
            :class="{ 'p-invalid': QRadarUrlError }"
          />
          <small class="text-color-secondary text-sm font-normal leading-tight">
            The URL that will receive the collected data from Data Streaming.
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
            :class="{ 'p-invalid': logTypeError }"
          />
          <small class="text-color-secondary text-sm font-normal leading-tight">
            Specify the record type of the data that's being submitted. It can contain only letters,
            numbers, and the underscore (_) character, and it can't exceed 100 characters.
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
            class="flex flex-col w-full"
            :class="{ 'p-invalid': sharedKeyError }"
            :feedback="false"
            toggleMask
          />
          <small class="text-color-secondary text-sm font-normal leading-tight">
            The Shared Key of the Workspace.
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
            type="text"
          />
          <small class="text-color-secondary text-sm font-normal leading-tight">
            The field that will be used for the TimeGenerated field. When not specified, It'll use
            the ingestion time.
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
            :class="{ 'p-invalid': workspaceIDError }"
          />
          <small class="text-color-secondary text-sm font-normal leading-tight">
            The ID of your Workspace.
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
            :class="{ 'p-invalid': storageAccountError }"
          />
          <small class="text-color-secondary text-sm font-normal leading-tight">
            The storage account of your Azure Blob Storage.
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
            :class="{ 'p-invalid': containerNameError }"
          />
          <small class="text-color-secondary text-sm font-normal leading-tight">
            The name of your Azure Blob Storage container.
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
            :class="{ 'p-invalid': blobTokenError }"
          />
          <small class="text-color-secondary text-sm font-normal leading-tight">
            The blob SAS token of your Azure Blob Storage.
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
    description="Description"
    v-if="endpoint === 'standard'"
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="payloadFormat"
          class="text-color text-base font-medium"
          >Format *</label
        >
        <InputText
          v-model="payloadFormat"
          type="text"
          placeholder="$dataset"
          :class="{ 'p-invalid': payloadFormatError }"
        />
        <small class="text-color-secondary text-xs font-normal leading-tight">
          The format that payload will be sent. The $dataset variable will be replaced by all logs
          already with the log line separator applied.
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
          >Log Line Separator *</label
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
          >Max Size</label
        >
        <InputNumber
          v-model="maxSize"
          placeholder="1000000"
          :useGrouping="false"
        />
        <small class="text-color-secondary text-xs font-normal leading-tight">
          You can define the maximum size of data packets in bytes. Use a value starting from
          1000000.
        </small>
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal title="Status">
    <template #inputs>
      <div class="flex flex-col w-full gap-2">
        <div
          class="flex gap-6 md:align-items-center max-sm:flex-col max-sm:align-items-baseline max-sm:gap-3"
        >
          <span class="p-input-icon-right w-full flex max-w-lg items-start gap-2 pb-3 pt-2">
            <InputSwitch
              v-model="status"
              inputId="active"
            />
            <label
              class="text-color text-sm font-normal leading-5"
              for="active"
              >Active</label
            >
          </span>
        </div>
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'

  import Dropdown from 'primevue/dropdown'
  import RadioButton from 'primevue/radiobutton'
  import PrimePassword from 'primevue/password'
  import PickList from 'primevue/picklist'
  import InputText from 'primevue/inputtext'
  import InputSwitch from 'primevue/inputswitch'
  import ButtonPrimer from 'primevue/button'
  import InputNumber from 'primevue/inputnumber'
  import InlineMessage from 'primevue/inlinemessage'
  import TextArea from 'primevue/textarea'
  import { onMounted, ref, computed, watch } from 'vue'
  import { useField } from 'vee-validate'

  import { useAccountStore } from '@/stores/account'

  const props = defineProps({
    listDataStreamingTemplateService: {
      type: Function,
      required: true
    },
    listDataStreamingDomainsService: {
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
    { label: 'Plain/text', value: 'plain/text' },
    { label: 'Application/gzip', value: 'application/gzip' }
  ])

  // Campos do formulário
  const { value: name, errorMessage: nameError } = useField('name')
  const { value: dataSource, errorMessage: dataSourceError } = useField('dataSource')
  const { value: template, errorMessage: templateError } = useField('template')
  const { value: domainOption } = useField('domainOption')
  const { value: domains } = useField('domains')
  const { value: endpoint } = useField('endpoint')
  const { value: status } = useField('status')
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
  const dataSet = ref('')

  const loaderDataStreamTemplates = async () => {
    const templates = await props.listDataStreamingTemplateService()
    listTemplates.value = templates

    const hasFirstTemplates = listTemplates?.value[0]?.value
    if (hasFirstTemplates) {
      const firstTemplateValue = listTemplates.value[0].value
      return firstTemplateValue
    }
    return ''
  }

  const loaderDataStreamDomains = async () => {
    const domainResponse = await props.listDataStreamingDomainsService()
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
    dataSet.value = listTemplates.value[index].template
  }

  // Using the store
  const store = useAccountStore()

  const theme = computed(() => {
    return store.currentTheme === 'light' ? 'vs' : 'vs-dark'
  })

  const optionsMonacoEditor = computed(() => {
    return {
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
    const template = await loaderDataStreamTemplates()
    const domains = await loaderDataStreamDomains()

    if (props.resetForm) {
      const initialValues = {
        name: '',
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

  onMounted(() => {
    initializeFormValues()
  })
</script>
