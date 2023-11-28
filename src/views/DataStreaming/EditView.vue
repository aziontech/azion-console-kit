<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edit Data Streaming"></PageHeadingBlock>
    </template>
    <template #content>
      <EditFormBlock
        :editService="props.editDataStreamingService"
        :loadService="props.loadDataStreamingService"
        :initialDataSetter="setValues"
        :formData="values"
        :formMeta="meta"
      >
        <template #form>
          <FormHorizontal
            title="General"
            description="Edit a data streaming to feed your data platforms with logs from your applications."
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
                  placeholder="My data streaming"
                  type="text"
                  :class="{ 'p-invalid': errors.name }"
                />
                <small class="text-xs text-color-secondary font-normal leading-tight">
                Give a unique and easy-to-remember name.</small
                >
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
            description="Decide the source and the variables from which data should be collected."
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
                    :class="{ 'p-invalid': errors.dataSource }"
                    v-model="dataSource"
                    :options="listDataSources"
                    optionLabel="label"
                    optionValue="value"
                    class="w-full"
                  />
                  <small class="text-color-secondary text-xs font-normal leading-tight">
                    Represents the data source your data will be collected from.
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
                    Represents a preset of variables for specific sources or an open template to choose variables.
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
                  Exhibits or allows you to write the variables that'll be sent to your connector in a JSON format.
                </small>
              </div>
            </template>
          </FormHorizontal>
          <FormHorizontal
            title="Domains"
            description="Associate registered domains with this data streaming to define the addresses from which the data will be collected."
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
                      >All Current and Future Domains</label
                    >
                  </div>
                  <div class="flex no-wrap gap-2 items-center">
                    <RadioButton
                      v-model="domainOption"
                      inputId="filter-domain"
                      name="filter domain"
                      value="0"
                    />
                    <label class="text-color text-sm font-normal leading-tight"
                      >Filter Domains
                    </label>
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
                <small class="text-color-secondary text-sm font-normal leading-tight">
                  Select an item from the list and then use the arrows to move it between the available and selected domains boxes. Use the double-line arrows to move all items.
                </small>
              </div>
            </template>
          </FormHorizontal>

          <FormHorizontal title="Destination"
            description="Decide to which data platform your collected data will be sent to.">
            <template #inputs>
              <div class="flex flex-col w-full sm:max-w-xs gap-2">
                <label
                  for="id"
                  class="text-color text-base font-medium"
                  >Connector *</label
                >
                <Dropdown
                  :class="{ 'p-invalid': errors.template }"
                  v-model="endpoint"
                  :options="listEndpoint"
                  optionLabel="label"
                  optionValue="value"
                  class="w-full"
                />
                <small class="text-color-secondary text-sm font-normal leading-tight">
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
                    :class="{ 'p-invalid': errors.endpointUrl }"
                  />
                  <small class="text-color-secondary text-xs font-normal leading-tight">
                    Specific URL that'll receive the collected data.
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
                    Which information will be sent in your data. The "$dataset" variable calls all variables from the chosen template in NDJSON format.
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
                    >Payload Log Line Separator *</label
                  >
                  <InputText
                    v-model="lineSeparator"
                    type="text"
                    placeholder="\n"
                    :class="{ 'p-invalid': errors.lineSeparator }"
                  />
                  <small class="text-color-secondary text-xs font-normal leading-tight">
                    Character that will be used at the end of each log line. The "\n" escape sequence breaks values into different lines in NDJSON format.
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
                    >Payload Max Size</label
                  >
                  <InputNumber
                    v-model="maxSize"
                    placeholder="1000000"
                    :useGrouping="false"
                    :class="{ 'p-invalid': errors.maxSize }"
                  />
                  <small class="text-color-secondary text-xs font-normal leading-tight">
                    Customizable maximum size of data packets in bytes. Accepts values starting
                    from 1000000.
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
                  <TextArea
                    v-model="bootstrapServers"
                    placeholder="host1:port1,host2:port2,..."
                    :class="{ 'p-invalid': errors.bootstrapServers }"
                    rows="5"
                    cols="30"
                  />
                  <small class="text-color-secondary text-xs font-normal leading-tight">
                    List of hosts and ports in a Kafka cluster. Separate items by comma and no space.
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
                    placeholder="analytics.fct.pageviews.0"
                    type="text"
                    :class="{ 'p-invalid': errors.kafkaTopic }"
                  />
                  <small class="text-color-secondary text-xs font-normal leading-tight">
                    Name of the topic in a Kafka cluster.
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
                      >Enable Transport Layer Security (TLS)</label
                    >
                    <small class="text-color-secondary text-sm font-normal leading-tight">
                      Send encrypted data to secure communication. Make sure the receiving connector uses a trusted CA certificate.
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
                    :class="{ 'p-invalid': errors.host }"
                  />
                  <small class="text-color-secondary text-sm font-normal leading-tight">
                    Specific URL that'll receive the collected data. Accepts all providers that work with an S3
                    protocol.
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
                    placeholder="mys3bucket"
                    :class="{ 'p-invalid': errors.bucket }"
                  />
                  <small class="text-color-secondary text-sm font-normal leading-tight">
                    Name of the bucket to which the object will be sent.
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
                    placeholder="us-east-1"
                    :class="{ 'p-invalid': errors.region }"
                  />
                  <small class="text-color-secondary text-sm font-normal leading-tight">
                    Region in which your bucket is hosted.
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
                    placeholder="ORIA5ZEH9MW4NL5OITY4"
                  />
                  <small class="text-color-secondary text-sm font-normal leading-tight">
                    Public key to access your bucket.
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
                    placeholder="+PLjkUWJyOLth3anuWXcLLVrMLeiiiThIokaPEiw"
                    class="flex flex-col w-full"
                    :class="{ 'p-invalid': errors.secretKey }"
                    :feedback="false"
                    toggleMask
                  />
                  <small class="text-color-secondary text-sm font-normal leading-tight">
                    Secret key to access your bucket.
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
                    placeholder="waf_logs_1622575860091_37d66e78-c308-4006-9d4d-1c013ed89276"
                    class="flex flex-col w-full"
                    :class="{ 'p-invalid': errors.objectKey }"
                    :feedback="false"
                    toggleMask
                  />
                  <small class="text-color-secondary text-sm font-normal leading-tight">
                    Prefix added to the name of the uploaded object to appear on the files that will be sent. Composed of Prefix + Timestamp + UUID.
                  </small>
                  <small
                    id="object-key-help"
                    class="p-error"
                    >{{ errors.objectKey }}</small
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
                    placeholder="mycustomGBQproject01"
                    :class="{ 'p-invalid': errors.projectID }"
                  />
                  <small class="text-color-secondary text-sm font-normal leading-tight">
                    ID of the project in Google Cloud.
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
                    placeholder="myGBQdataset"
                  />
                  <small class="text-color-secondary text-sm font-normal leading-tight">
                    Name of the dataset created on Google BigQuery. Case sensitive field.
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
                    placeholder="mypagaviewtable01"
                    :class="{ 'p-invalid': errors.tableID }"
                  />
                  <small class="text-color-secondary text-sm font-normal leading-tight">
                    Name of the table on Google BigQuery.
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
                    class="min-h-[100px] surface-border border rounded-md overflow-hidden"
                  />
                  <small class="text-color-secondary text-sm font-normal leading-tight">
                    JSON file provided by Google Cloud used to authenticate with Google
                    services.
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
                    >URL *</label
                  >
                  <InputText
                    v-model="elasticsearchUrl"
                    type="text"
                    placeholder="https://elasticsearch-domain.com/myindex"
                    :class="{ 'p-invalid': errors.elasticsearchUrl }"
                  />
                  <small class="text-color-secondary text-sm font-normal leading-tight">
                    URL address plus the Elasticsearch index that'll receive the collected data.
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
                  <TextArea
                    id="apiKey"
                    placeholder="VuaCfGcBCdbkQm-e5aOx:ui2lp2axTNmsyakw9tvNnw"
                    v-model="apiKey"
                    :class="{ 'p-invalid': errors.apiKey }"
                    rows="5"
                    cols="30"
                  />
                  <small class="text-color-secondary text-sm font-normal leading-tight">
                    API key used for Elasticsearch authorization in base64 encode format.
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
                    >URL *</label
                  >
                  <InputText
                    v-model="splunkUrl"
                    type="text"
                    placeholder="https://inputs.splunk-client.splunkcloud.com:123456/services/collector"
                    :class="{ 'p-invalid': errors.splunkUrl }"
                  />
                  <small class="text-color-secondary text-sm font-normal leading-tight">
                    URL that'll receive the collected data. If you have an
                    alternative index to point, add it at the end of the URL.
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
                  <TextArea
                    v-model="splunkApiKey"
                    placeholder="crfe25d2-23j8-48gf-a9ks-6b75w3ska674"
                    :class="{ 'p-invalid': errors.splunkApiKey }"
                    rows="5"
                    cols="30"
                  />
                  <small class="text-color-secondary text-sm font-normal leading-tight">
                    HTTP Event Collector Token provided during the Splunk installation.
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
                    placeholder="MyKDFConnector"
                    type="text"
                    :class="{ 'p-invalid': errors.streamName }"
                  />
                  <small class="text-color-secondary text-sm font-normal leading-tight">
                    Delivery stream name.
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
                    >Region *</label
                  >
                  <InputText
                    v-model="awsRegion"
                    placeholder="us-east-1"
                    type="text"
                    :class="{ 'p-invalid': errors.awsRegion }"
                  />
                  <small class="text-color-secondary text-sm font-normal leading-tight">
                    Region where your Amazon Kinesis instance is running.
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
                    placeholder="ORIA5ZEH9MW4NL5OITY4"
                    v-model="awsAccessKey"
                    type="text"
                    class="flex flex-col w-full"
                    :class="{ 'p-invalid': errors.awsAccessKey }"
                    :feedback="false"
                    toggleMask
                  />
                  <small class="text-color-secondary text-sm font-normal leading-tight">
                    Public key to access the Data Firehose given by AWS.
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
                    placeholder="+PLjkUWJyOLth3anuWXcLLVrMLeiiiThIokaPEiw"
                    v-model="awsSecretKey"
                    type="text"
                    class="flex flex-col w-full"
                    :class="{ 'p-invalid': errors.awsSecretKey }"
                    :feedback="false"
                    toggleMask
                  />
                  <small class="text-color-secondary text-sm font-normal leading-tight">
                    Secret key to access the Data Firehose given by AWS.
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
                    >URL *</label
                  >
                  <InputText
                    v-model="datadogUrl"
                    type="text"
                    placeholder="https://http-intake.logs.datadoghq.com/v1/input"
                    :class="{ 'p-invalid': errors.datadogUrl }"
                  />
                  <small class="text-color-secondary text-sm font-normal leading-tight">
                    URL or URI of the Datadog endpoint.
                  </small>
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
                  <TextArea
                    id="datadogApiKey"
                    placeholder="ij9076f1ujik17a81f938yhru5g713422"
                    v-model="datadogApiKey"
                    :class="{ 'p-invalid': errors.datadogApiKey }"
                    rows="5"
                    cols="30"
                  />
                  <small class="text-color-secondary text-sm font-normal leading-tight">
                    API key generated through the Datadog dashboard.
                  </small>
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
                    >URL *</label
                  >
                  <InputText
                    v-model="QRadarUrl"
                    type="text"
                    placeholder="http://137.15.824.10:14440"
                    :class="{ 'p-invalid': errors.QRadarUrl }"
                  />
                  <small class="text-color-secondary text-sm font-normal leading-tight">
                    Specific URL that'll receive the collected data.
                  </small>
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
                    id="logType"
                    placeholder="AzureMonitorTest"
                    v-model="logType"
                    type="text"
                    :class="{ 'p-invalid': errors.logType }"
                  />
                  <small class="text-color-secondary text-sm font-normal leading-tight">
                    Record type of the data that's being submitted. Accepts only
                    letters, numbers, and the underscore (_) character, and it can't exceed 100
                    characters.
                  </small>
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
                  <PrimePassword
                    id="sharedKey"
                    placeholder="OiA9AdGr4As5Iujg5FAHsTWfawxOD4"
                    v-model="sharedKey"
                    type="text"
                    class="flex flex-col w-full"
                    :class="{ 'p-invalid': errors.sharedKey }"
                    :feedback="false"
                    toggleMask
                  />
                  <small class="text-color-secondary text-sm font-normal leading-tight">
                    Shared Key of the Workspace.
                  </small>
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
                    id="timeGeneratedField"
                    placeholder="myCustomTimeField"
                    v-model="generatedField"
                    type="text"
                  />
                  <small class="text-color-secondary text-sm font-normal leading-tight">
                    Specifies how long it’ll take for the log to be available after collection. Uses ingestion time if not specified.
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
                    placeholder="kik73154-0426-464c-aij3-eg6d24u87c50"
                    v-model="workspaceID"
                    type="text"
                    :class="{ 'p-invalid': errors.workspaceID }"
                  />
                  <small class="text-color-secondary text-sm font-normal leading-tight">
                    ID of the Workspace.
                  </small>
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
                    for="storageAccount"
                    class="text-color text-base font-medium"
                    >Storage Account *</label
                  >
                  <InputText
                    id="storageAccount"
                    placeholder="mystorageaccount"
                    v-model="storageAccount"
                    type="text"
                    :class="{ 'p-invalid': errors.storageAccount }"
                  />
                  <small class="text-color-secondary text-sm font-normal leading-tight">
                    Name of the storage account.
                  </small>
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
                    id="containerName"
                    placeholder="mycontainer"
                    v-model="containerName"
                    type="text"
                    :class="{ 'p-invalid': errors.containerName }"
                  />
                  <small class="text-color-secondary text-sm font-normal leading-tight">
                    Name of the container.
                  </small>
                  <small
                    id="container-name-help"
                    class="p-error"
                    >{{ errors.containerName }}</small
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
                    placeholder="sp=oiuwdl&st=2022-04-14T18:05:08Z&se=2026-03-02T02:05:08Z&sv=2020-08-04&sr=c&sig=YUi0TBEt7XTlxXex4Jui%2Fc88h6qAgMmCY4XIXeMvxa0%3F"
                    v-model="blobToken"
                    type="text"
                    :class="{ 'p-invalid': errors.blobToken }"
                  />
                  <small class="text-color-secondary text-sm font-normal leading-tight">
                    Token generated by Blob Storage. It should have create, read, write, and list accesses granted.
                  </small>
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
      </EditFormBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { useForm, useField } from 'vee-validate'
  import * as yup from 'yup'
  import { useAccountStore } from '@/stores/account'

  // Import the components
  import EditFormBlock from '@/templates/edit-form-block-new'
  import FormHorizontal from '@/templates/create-form-block-new/form-horizontal'

  import Dropdown from 'primevue/dropdown'
  import RadioButton from 'primevue/radiobutton'
  import PrimePassword from 'primevue/password'
  import PickList from 'primevue/picklist'
  import InputText from 'primevue/inputtext'
  import InputSwitch from 'primevue/inputswitch'
  import ButtonPrimer from 'primevue/button'
  import InputNumber from 'primevue/inputnumber'
  import TextArea from 'primevue/textarea'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'

  const props = defineProps({
    listDataStreamingTemplateService: {
      type: Function,
      required: true
    },
    listDataStreamingDomainsService: {
      type: Function,
      required: true
    },
    loadDataStreamingService: {
      type: Function,
      required: true
    },
    editDataStreamingService: {
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
    { label: 'plain/text', value: 'plain/text' },
    { label: 'application/gzip', value: 'application/gzip' }
  ])

  // Schema de Validação
  const validationSchema = yup.object({
    name: yup.string().required(),
    dataSource: yup.string().required(),
    template: yup.string().required(),
    dataSet: yup.string(),
    domainOption: yup.string().required(),
    endpoint: yup.string().required(),
    status: yup.boolean(),
    // standard
    endpointUrl: yup.string().when('endpoint', {
      is: 'standard',
      then: (schema) => schema.required('Endpoint URL is a required field')
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
      then: (schema) => schema.required('Payload Max Size is a required field')
    }),
    lineSeparator: yup.string().when('endpoint', {
      is: 'standard',
      then: (schema) => schema.required('Payload Log Line Separator is a required field')
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
      then: (schema) => schema.max(150).required('Object Key Prefix is a required field')
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
      then: (schema) => schema.required('API Key is a required field')
    }),

    // splunk
    splunkUrl: yup.string().when('endpoint', {
      is: 'splunk',
      then: (schema) => schema.required('Splunk URL is a required field')
    }),
    splunkApiKey: yup.string().when('endpoint', {
      is: 'splunk',
      then: (schema) => schema.required('API Key is a required field')
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
      then: (schema) => schema.required('URL is a required field')
    }),
    datadogApiKey: yup.string().when('endpoint', {
      is: 'datadog',
      then: (schema) => schema.required('API Key is a required field')
    }),

    // QRadar
    QRadarUrl: yup.string().when('endpoint', {
      is: 'qradar',
      then: (schema) => schema.required('URL is a required field')
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

  const { setValues, errors, meta, values } = useForm({
    validationSchema,
    initialValues: {
      id: '',
      name: '',
      dataSource: 'http',
      template: '',
      dataSet: '',
      domainOption: '1',
      domains: [],
      endpoint: '',
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
        if (domains.value[1].length > 0) {
          domains.value[1].forEach((element) => {
            domains.value[0].push(element)
          })
          domains.value[1] = []
        }
      }
    }
  )
</script>
