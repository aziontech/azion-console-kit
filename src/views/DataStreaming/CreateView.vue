<template>
  <CreateFormBlock
    pageTitle="Create Data Streaming"
    :createService="props.createDataStreamingService"
    :formData="values"
    :formMeta="meta"
    :cleanFormCallback="resetForm"
  >
    <template #form>
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
              :class="{ 'p-invalid': errors.name }"
            />
            <small
              id="name-help"
              class="p-error"
              >{{ errors.name }}</small
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
                :class="{ 'p-invalid': errors.dataSource }"
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
                :class="{ 'p-invalid': errors.template }"
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
              class="min-h-[100px]"
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
              :class="{ 'p-invalid': errors.template }"
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
                :class="{ 'p-invalid': errors.endpointUrl }"
              />
              <small class="text-color-secondary text-xs font-normal leading-tight">
                The URL to receive the collected data from Data Streaming.
              </small>
              <small
                id="endpoint-url-help"
                class="p-error"
                >{{ errors.endpointUrl }}</small
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
                :class="{ 'p-invalid': errors.payloadFormat }"
              />
              <small class="text-color-secondary text-xs font-normal leading-tight">
                The format that payload will be sent. The $dataset variable will be replaced by all
                logs already with the log line separator applied.
              </small>
              <small
                id="data-set-help"
                class="p-error"
                >{{ errors.payloadFormat }}</small
              >
            </div>

            <div class="flex flex-col sm:max-w-lg w-full gap-2">
              <label
                for="lineSeparator"
                class="text-color text-base font-medium"
                >Log Line Separator Payload *</label
              >
              <InputText
                v-model="lineSeparator"
                type="text"
                placeholder="\n"
                :class="{ 'p-invalid': errors.lineSeparator }"
              />
              <small class="text-color-secondary text-xs font-normal leading-tight">
                The format that payload will be sent. The $dataset variable will be replaced by all
                logs already with the log line separator applied.
              </small>
              <small
                id="max-size-help"
                class="p-error"
                >{{ errors.lineSeparator }}</small
              >
            </div>

            <div class="flex flex-col sm:max-w-lg w-full gap-2">
              <label
                for="maxSize"
                class="text-color text-base font-medium"
                >Max Size Payload *</label
              >
              <InputNumber
                v-model="maxSize"
                placeholder="1000000"
                :useGrouping="false"
                :class="{ 'p-invalid': errors.maxSize }"
              />
              <small class="text-color-secondary text-xs font-normal leading-tight">
                You can define the maximum size of data packets in bytes. Use a value starting from
                1000000.
              </small>
              <small
                id="max-size-help"
                class="p-error"
                >{{ errors.maxSize }}</small
              >
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
              <Textarea
                v-model="bootstrapServers"
                placeholder="host1:port1,host2:port2,..."
                :class="{ 'p-invalid': errors.bootstrapServers }"
                rows="5"
                cols="30"
              />
              <small class="text-color-secondary text-xs font-normal leading-tight">
                The list of host and port (comma-separated) from Kafka brokers.
              </small>
              <small
                id="bootstrap-servers-help"
                class="p-error"
                >{{ errors.bootstrapServers }}</small
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
                :class="{ 'p-invalid': errors.kafkaTopic }"
              />
              <small class="text-color-secondary text-xs font-normal leading-tight">
                The topic name from Kafka brokers.
              </small>
              <small
                id="kafka-topic-help"
                class="p-error"
                >{{ errors.kafkaTopic }}</small
              >
            </div>

            <div class="flex sm:max-w-lg w-full gap-2 items-top">
              <InputSwitch
                v-model="tlsOption"
                id="tlsOption"
                class="flex-shrink-0 flex-grow"
                :class="{ 'p-invalid': errors.tlsOption }"
              />
              <div class="flex flex-col gap-1">
                <label
                  for="tlsOption"
                  class="text-sm font-normal leading-tight"
                  >Use Transport Layer Security (TLS)</label
                >
                <small class="text-color-secondary text-sm font-normal leading-tight">
                  If you need secure logging, use Transport Layer Security (TLS). Make sure your
                  server uses a trusted CA certificate.
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
                :class="{ 'p-invalid': errors.host }"
              />
              <small class="text-color-secondary text-sm font-normal leading-tight">
                The URL of your S3 host. You may connect with every provider that works with S3
                protocol, for example: AWS, Google Cloud Plataform, Azion, etc..
              </small>
              <small
                id="host-help"
                class="p-error"
                >{{ errors.host }}</small
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
                :class="{ 'p-invalid': errors.bucket }"
              />
              <small class="text-color-secondary text-sm font-normal leading-tight">
                The name of your S3 bucket.
              </small>
              <small
                id="bucket-help"
                class="p-error"
                >{{ errors.bucket }}</small
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
                :class="{ 'p-invalid': errors.region }"
              />
              <small class="text-color-secondary text-sm font-normal leading-tight">
                The region of your S3 bucket.
              </small>
              <small
                id="region-help"
                class="p-error"
                >{{ errors.region }}</small
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
                :class="{ 'p-invalid': errors.accessKey }"
                :feedback="false"
                toggleMask
              />
              <small class="text-color-secondary text-sm font-normal leading-tight">
                The access key of your S3 bucket.
              </small>
              <small
                id="access-key-help"
                class="p-error"
                >{{ errors.accessKey }}</small
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
                :class="{ 'p-invalid': errors.secretKey }"
                :feedback="false"
                toggleMask
              />
              <small class="text-color-secondary text-sm font-normal leading-tight">
                The secret key of your S3 bucket.
              </small>
              <small
                id="secret-key-help"
                class="p-error"
                >{{ errors.secretKey }}</small
              >
            </div>

            <div class="flex flex-col sm:max-w-lg w-full gap-2">
              <label
                for="objectKeyPrefix"
                class="text-color text-base font-medium"
                >Object Key Prefix *</label
              >
              <PrimePassword
                id="objectKey"
                v-model="objectKey"
                type="text"
                class="flex flex-col w-full"
                :class="{ 'p-invalid': errors.objectKey }"
                :feedback="false"
                toggleMask
              />
              <small class="text-color-secondary text-sm font-normal leading-tight">
                The format of the object that will be created in your S3 bucket.
              </small>
              <small
                id="object-key-help"
                class="p-error"
                >{{ errors.objectKey }}</small
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
                    :class="{ 'p-invalid': errors.contentType }"
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
                :class="{ 'p-invalid': errors.projectID }"
              />
              <small class="text-color-secondary text-sm font-normal leading-tight">
                The ID of your project in Google Cloud.
              </small>

              <small
                id="project-id-help"
                class="p-error"
                >{{ errors.projectID }}</small
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
                :class="{ 'p-invalid': errors.datasetID }"
              />
              <small class="text-color-secondary text-sm font-normal leading-tight">
                The ID of your dataset created on Google BigQuery.
              </small>
              <small
                id="dataset-id-help"
                class="p-error"
                >{{ errors.datasetID }}</small
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
                :class="{ 'p-invalid': errors.tableID }"
              />
              <small class="text-color-secondary text-sm font-normal leading-tight">
                The ID of your table that will receive the streamed data.
              </small>
              <small
                id="table-id-help"
                class="p-error"
                >{{ errors.tableID }}</small
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
                class="min-h-[100px]"
              />
              <small class="text-color-secondary text-sm font-normal leading-tight">
                The JSON file with the key that will be used to authenticate with Google services.
              </small>
              <small
                id="service-account-key-help"
                class="p-error"
                >{{ errors.serviceAccountKey }}</small
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
                :class="{ 'p-invalid': errors.elasticsearchUrl }"
              />
              <small class="text-color-secondary text-sm font-normal leading-tight">
                The URL plus the index of the Elasticsearch to receive the collected data from Data
                Streaming.
              </small>
              <small
                id="elastic-search-url-help"
                class="p-error"
                >{{ errors.elasticsearchUrl }}</small
              >
            </div>

            <div class="flex flex-col sm:max-w-lg w-full gap-2">
              <label
                for="apiKey"
                class="text-color text-base font-medium"
                >API Key *</label
              >
              <Textarea
                v-model="apiKey"
                :class="{ 'p-invalid': errors.apiKey }"
                rows="5"
                cols="30"
              />
              <small class="text-color-secondary text-sm font-normal leading-tight">
                The API Key in base64 used for Elasticsearch authorization.
              </small>
              <small
                id="api-key-help"
                class="p-error"
                >{{ errors.apiKey }}</small
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
                :class="{ 'p-invalid': errors.splunkUrl }"
              />
              <small class="text-color-secondary text-sm font-normal leading-tight">
                The URL that will receive the collected data from Data Streaming, if you have an
                alternative index to point, you can do at the end of the URL.
              </small>
              <small
                id="splunk-url-help"
                class="p-error"
                >{{ errors.splunkUrl }}</small
              >
            </div>

            <div class="flex flex-col sm:max-w-lg w-full gap-2">
              <label
                for="splunkApiKey"
                class="text-color text-base font-medium"
                >API Key *</label
              >
              <Textarea
                v-model="splunkApiKey"
                :class="{ 'p-invalid': errors.splunkApiKey }"
                rows="5"
                cols="30"
              />
              <small class="text-color-secondary text-sm font-normal leading-tight">
                The HTTP Event Collector Token, provided by your Splunk installation.
              </small>
              <small
                id="splunk-api-key-help"
                class="p-error"
                >{{ errors.splunkApiKey }}</small
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
                :class="{ 'p-invalid': errors.streamName }"
              />
              <small class="text-color-secondary text-sm font-normal leading-tight">
                The name of your delivery Kinesis Firehose stream.
              </small>
              <small
                id="stream-name-help"
                class="p-error"
                >{{ errors.streamName }}</small
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
                :class="{ 'p-invalid': errors.awsRegion }"
              />
              <small class="text-color-secondary text-sm font-normal leading-tight">
                The region of your S3 bucket.
              </small>
              <small
                id="aws-region-help"
                class="p-error"
                >{{ errors.awsRegion }}</small
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
                :class="{ 'p-invalid': errors.awsAccessKey }"
                :feedback="false"
                toggleMask
              />
              <small class="text-color-secondary text-sm font-normal leading-tight">
                The access key of your Kinesis Firehose stream.
              </small>
              <small
                id="aws-access-key-help"
                class="p-error"
                >{{ errors.awsAccessKey }}</small
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
                :class="{ 'p-invalid': errors.awsSecretKey }"
                :feedback="false"
                toggleMask
              />
              <small class="text-color-secondary text-sm font-normal leading-tight">
                The secret key of your Kinesis Firehose stream.
              </small>
              <small
                id="aws-secret-key-help"
                class="p-error"
                >{{ errors.awsSecretKey }}</small
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
                :class="{ 'p-invalid': errors.datadogUrl }"
              />
              <small
                id="datadog-url-help"
                class="p-error"
                >{{ errors.datadogUrl }}</small
              >
            </div>

            <div class="flex flex-col sm:max-w-lg w-full gap-2">
              <label
                for="apiKey"
                class="text-color text-base font-medium"
                >API Key *</label
              >
              <InputText
                v-model="datadogApiKey"
                type="text"
                :class="{ 'p-invalid': errors.datadogApiKey }"
              />
              <small
                id="datadog-api-key-help"
                class="p-error"
                >{{ errors.datadogApiKey }}</small
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
                :class="{ 'p-invalid': errors.QRadarUrl }"
              />
              <small
                id="qradar-url-help"
                class="p-error"
                >{{ errors.QRadarUrl }}</small
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
                v-model="logType"
                type="text"
                :class="{ 'p-invalid': errors.logType }"
              />
              <small
                id="log-type-help"
                class="p-error"
                >{{ errors.logType }}</small
              >
            </div>

            <div class="flex flex-col sm:max-w-lg w-full gap-2">
              <label
                for="sharedKey"
                class="text-color text-base font-medium"
                >Shared Key *</label
              >
              <InputText
                v-model="sharedKey"
                type="text"
                :class="{ 'p-invalid': errors.sharedKey }"
              />
              <small
                id="shared-key-help"
                class="p-error"
                >{{ errors.sharedKey }}</small
              >
            </div>

            <div class="flex flex-col sm:max-w-lg w-full gap-2">
              <label
                for="timeGeneratedField"
                class="text-color text-base font-medium"
                >Time Generated Field</label
              >
              <InputText
                v-model="generatedField"
                type="text"
              />
            </div>

            <div class="flex flex-col sm:max-w-lg w-full gap-2">
              <label
                for="workspaceID"
                class="text-color text-base font-medium"
                >Workspace ID *</label
              >
              <InputText
                v-model="workspaceID"
                type="text"
                :class="{ 'p-invalid': errors.workspaceID }"
              />
              <small
                id="workspace-id-help"
                class="p-error"
                >{{ errors.workspaceID }}</small
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
                for="storangeAccount"
                class="text-color text-base font-medium"
                >Storage Account *</label
              >
              <InputText
                v-model="storageAccount"
                type="text"
                :class="{ 'p-invalid': errors.storageAccount }"
              />
              <small
                id="storage-account-help"
                class="p-error"
                >{{ errors.storageAccount }}</small
              >
            </div>

            <div class="flex flex-col sm:max-w-lg w-full gap-2">
              <label
                for="containerName"
                class="text-color text-base font-medium"
                >Container Name *</label
              >
              <InputText
                v-model="containerName"
                type="text"
                :class="{ 'p-invalid': errors.containerName }"
              />
              <small
                id="container-name-help"
                class="p-error"
                >{{ errors.containerName }}</small
              >
            </div>

            <div class="flex flex-col sm:max-w-lg w-full gap-2">
              <label
                for="containerName"
                class="text-color text-base font-medium"
                >Blob SAS Token *</label
              >
              <InputText
                v-model="blobToken"
                type="text"
                :class="{ 'p-invalid': errors.blobToken }"
              />
              <small
                id="blob-token-help"
                class="p-error"
                >{{ errors.blobToken }}</small
              >
            </div>
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
                  id="active"
                />
                <div class="flex-col gap-1">
                  <div class="text-color text-sm font-normal leading-5">Active</div>
                </div>
              </span>
            </div>
          </div>
        </template>
      </FormHorizontal>
    </template>
  </CreateFormBlock>
</template>

<script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { useForm, useField } from 'vee-validate'
  import * as yup from 'yup'
  import { useAccountStore } from '@/stores/account'

  // Import the components
  import CreateFormBlock from '@/templates/create-form-block-new'
  import FormHorizontal from '@/templates/create-form-block-new/form-horizontal'

  import Dropdown from 'primevue/dropdown'
  import RadioButton from 'primevue/radiobutton'
  import PrimePassword from 'primevue/password'
  import PickList from 'primevue/picklist'
  import InputText from 'primevue/inputtext'
  import InputSwitch from 'primevue/inputswitch'
  import ButtonPrimer from 'primevue/button'
  import InputNumber from 'primevue/inputnumber'
  import Textarea from 'primevue/textarea'

  const props = defineProps({
    createDataStreamingService: {
      type: Function,
      required: true
    },
    listDataStreamingTemplateService: {
      type: Function,
      required: true
    },
    listDataStreamingDomainsService: {
      type: Function,
      required: true
    }
  })

  // Variables
  const listDataSources = ref([
    { label: 'Activity History', value: 'rtm_activity' },
    { label: 'Edge Applications', value: 'http' },
    { label: 'Edge Functions', value: 'cells_console' },
    { label: 'WAF Events', value: 'waf' }
  ])
  const listTemplates = ref([])
  const dataSet = ref('')
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

  // Schema de Validação
  const validationSchema = yup.object({
    name: yup.string().required('Name is a required field'),
    dataSource: yup.string().required(),
    template: yup.string().required(),
    dataSet: yup.string(),
    domainOption: yup.string().required(),
    endpoint: yup.string().required(),
    status: yup.boolean(),

    // standard
    endpointUrl: yup.string().when('endpoint', {
      is: 'standard',
      then: (schema) => schema.required('Endpoint url is a required field')
    }),
    headers: yup.array().of(
      yup.object().shape({
        value: yup.string().when('endpoint', {
          is: 'standard',
          then: (schema) => schema.required('Header value is required')
        })
      })
    ),
    maxSize: yup.number().when('endpoint', {
      is: 'standard',
      then: (schema) => schema.required('Max Size is a required field')
    }),
    lineSeparator: yup.string().when('endpoint', {
      is: 'standard',
      then: (schema) => schema.required('Log Line Separator is a required field')
    }),
    payloadFormat: yup.string().when('endpoint', {
      is: 'standard',
      then: (schema) => schema.required('Payload Format is a required field')
    }),

    // Kafka
    bootstrapServers: yup.string().when('endpoint', {
      is: 'kafka',
      then: (schema) => schema.max(150).required('Bootstrap Servers is a required field')
    }),
    kafkaTopic: yup.string().when('endpoint', {
      is: 'kafka',
      then: (schema) => schema.max(150).required('Kafka Topic is a required field')
    }),

    // s3
    host: yup.string().when('endpoint', {
      is: 's3',
      then: (schema) => schema.max(200).required('Host URL is a required field')
    }),
    bucket: yup.string().when('endpoint', {
      is: 's3',
      then: (schema) => schema.max(150).required('Bucket Name is a required field')
    }),
    region: yup.string().when('endpoint', {
      is: 's3',
      then: (schema) => schema.max(50).required('Region is a required field')
    }),
    accessKey: yup.string().when('endpoint', {
      is: 's3',
      then: (schema) => schema.max(150).required('Access Key is a required field')
    }),
    secretKey: yup.string().when('endpoint', {
      is: 's3',
      then: (schema) => schema.max(150).required('Secret Key is a required field')
    }),
    objectKey: yup.string().when('endpoint', {
      is: 's3',
      then: (schema) => schema.max(150).required('Object Key prefix is a required field')
    }),
    contentType: yup.string().when('endpoint', {
      is: 's3',
      then: (schema) => schema.required('Content Type is a required field')
    }),

    // google big query
    projectID: yup.string().when('endpoint', {
      is: 'big_query',
      then: (schema) => schema.required('Project ID is a required field')
    }),
    datasetID: yup.string().when('endpoint', {
      is: 'big_query',
      then: (schema) => schema.required('Dataset ID is a required field')
    }),
    tableID: yup.string().when('endpoint', {
      is: 'big_query',
      then: (schema) => schema.required('Table ID is a required field')
    }),
    serviceAccountKey: yup.string().when('endpoint', {
      is: 'big_query',
      then: (schema) => schema.required('Service Account Key is a required field')
    }),

    // elasticsearch
    elasticsearchUrl: yup.string().when('endpoint', {
      is: 'elasticsearch',
      then: (schema) => schema.required('Elasticsearch URL is a required field')
    }),
    apiKey: yup.string().when('endpoint', {
      is: 'elasticsearch',
      then: (schema) => schema.required('Api Key is a required field')
    }),

    // splunk
    splunkUrl: yup.string().when('endpoint', {
      is: 'splunk',
      then: (schema) => schema.required('Splunk URL is a required field')
    }),
    splunkApiKey: yup.string().when('endpoint', {
      is: 'splunk',
      then: (schema) => schema.required('Api Key is a required field')
    }),

    // aws_kinesis_firehose
    streamName: yup.string().when('endpoint', {
      is: 'aws_kinesis_firehose',
      then: (schema) => schema.required('Stream Name is a required field')
    }),
    awsRegion: yup.string().when('endpoint', {
      is: 'aws_kinesis_firehose',
      then: (schema) => schema.required('Region is a required field')
    }),
    awsAccessKey: yup.string().when('endpoint', {
      is: 'aws_kinesis_firehose',
      then: (schema) => schema.required('Access Key is a required field')
    }),
    awsSecretKey: yup.string().when('endpoint', {
      is: 'aws_kinesis_firehose',
      then: (schema) => schema.required('Secret Key is a required field')
    }),

    // datadog
    datadogUrl: yup.string().when('endpoint', {
      is: 'datadog',
      then: (schema) => schema.required('Datadog URL is a required field')
    }),
    datadogApiKey: yup.string().when('endpoint', {
      is: 'datadog',
      then: (schema) => schema.required('Api Key is a required field')
    }),

    // QRadar
    QRadarUrl: yup.string().when('endpoint', {
      is: 'qradar',
      then: (schema) => schema.required('Qradar URL is a required field')
    }),

    // azure_monitor
    logType: yup.string().when('endpoint', {
      is: 'azure_monitor',
      then: (schema) => schema.required('Log Type is a required field')
    }),
    sharedKey: yup.string().when('endpoint', {
      is: 'azure_monitor',
      then: (schema) => schema.required('Shared Key is a required field')
    }),
    workspaceID: yup.string().when('endpoint', {
      is: 'azure_monitor',
      then: (schema) => schema.required('Workspace ID is a required field')
    }),

    // azure_blob_storage
    storageAccount: yup.string().when('endpoint', {
      is: 'azure_blob_storage',
      then: (schema) => schema.required('Storage Account is a required field')
    }),
    containerName: yup.string().when('endpoint', {
      is: 'azure_blob_storage',
      then: (schema) => schema.required('Container Name is a required field')
    }),
    blobToken: yup.string().when('endpoint', {
      is: 'azure_blob_storage',
      then: (schema) => schema.required('Blob SAS Token is a required field')
    })
  })

  // Form e VeeValidate
  const { errors, meta, resetForm, values } = useForm({
    validationSchema,
    initialValues: {
      name: '',
      dataSource: 'http',
      template: '',
      dataSet: '',
      domainOption: '1',
      domains: [],
      endpoint: 'standard',
      status: true,

      // standard
      endpointUrl: '',
      headers: [{ value: '', deleted: false }],
      maxSize: 1000000,
      lineSeparator: '\n',
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
  })

  // Campos do formulário
  const { value: name } = useField('name')
  const { value: dataSource } = useField('dataSource')
  const { value: template } = useField('template')
  const { value: domainOption } = useField('domainOption')
  const { value: domains } = useField('domains')
  const { value: endpoint } = useField('endpoint')
  const { value: status } = useField('status')

  // standard
  const { value: endpointUrl } = useField('endpointUrl')
  const { value: headers } = useField('headers')
  const { value: maxSize } = useField('maxSize')
  const { value: lineSeparator } = useField('lineSeparator')
  const { value: payloadFormat } = useField('payloadFormat')

  // kafka
  const { value: bootstrapServers } = useField('bootstrapServers')
  const { value: kafkaTopic } = useField('kafkaTopic')
  const { value: tlsOption } = useField('tlsOption')

  // s3
  const { value: host } = useField('host')
  const { value: bucket } = useField('bucket')
  const { value: region } = useField('region')
  const { value: accessKey } = useField('accessKey')
  const { value: secretKey } = useField('secretKey')
  const { value: objectKey } = useField('objectKey')
  const { value: contentType } = useField('contentType')

  // google big query
  const { value: projectID } = useField('projectID')
  const { value: datasetID } = useField('datasetID')
  const { value: tableID } = useField('tableID')
  const { value: serviceAccountKey } = useField('serviceAccountKey')

  // elasticsearch
  const { value: elasticsearchUrl } = useField('elasticsearchUrl')
  const { value: apiKey } = useField('apiKey')

  // splunk
  const { value: splunkUrl } = useField('splunkUrl')
  const { value: splunkApiKey } = useField('splunkApiKey')

  // aws_kinesis_firehose
  const { value: streamName } = useField('streamName')
  const { value: awsRegion } = useField('awsRegion')
  const { value: awsAccessKey } = useField('awsAccessKey')
  const { value: awsSecretKey } = useField('awsSecretKey')

  // datadog
  const { value: datadogUrl } = useField('datadogUrl')
  const { value: datadogApiKey } = useField('datadogApiKey')

  // QRadar
  const { value: QRadarUrl } = useField('QRadarUrl')

  // azure_monitor
  const { value: logType } = useField('logType')
  const { value: sharedKey } = useField('sharedKey')
  const { value: generatedField } = useField('generatedField')
  const { value: workspaceID } = useField('workspaceID')

  // azure_blob_storage
  const { value: storageAccount } = useField('storageAccount')
  const { value: containerName } = useField('containerName')
  const { value: blobToken } = useField('blobToken')

  onMounted(async () => {
    await loaderDataStreamTemplates()
    await loaderDataStreamDomains()
  })

  const insertDataSet = (templateID) => {
    const index = listTemplates.value.map((el) => el.value).indexOf(templateID)
    dataSet.value = listTemplates.value[index].template
  }

  const loaderDataStreamTemplates = async () => {
    const templates = await props.listDataStreamingTemplateService()
    listTemplates.value = templates
    if (listTemplates?.value[0]?.value) template.value = listTemplates.value[0].value
  }

  const loaderDataStreamDomains = async () => {
    const response = await props.listDataStreamingDomainsService()
    domains.value = [response, []]
  }

  const addHeader = () => {
    headers.value.push({ value: '', deleted: true })
  }

  const removeHeader = (index) => {
    headers.value.splice(index, 1)
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
</script>
