<template>
  <EditFormBlock
    pageTitle="Edit Data Streaming"
    :editService="props.editDataStreamingService"
    :loadService="props.loadDataStreamingService"
    :initialDataSetter="setValues"
    :isValid="meta.valid"
    :formData="formValues"
  >
    <template #form>
      <!-- data-source -->
      <h1>Data</h1>
      <label>Name: *</label>
      <InputText
        v-model="name"
        type="text"
        placeholder="Name for Data Streaming"
        :class="{ 'p-invalid': errors.name }"
        v-tooltip.top="errors.name"
      />

      <label>Data Source: *</label>
      <Dropdown
        :class="{ 'p-invalid': errors.dataSource }"
        v-model="dataSource"
        :options="listDataSources"
        optionLabel="label"
        optionValue="value"
        class="w-full"
      />

      <label>Template: *</label>
      <Dropdown
        :class="{ 'p-invalid': errors.template }"
        v-model="template"
        :options="listTemplates"
        optionLabel="label"
        optionValue="value"
        class="w-full"
      />

      <label>Data Set:</label>
      <vue-monaco-editor
        v-model:value="dataSet"
        language="json"
        theme="vs-dark"
        :options="optionsMonacoEditor"
        class="min-h-[100px]"
      />

      <!-- domains -->
      <label>Options:</label>
      <div class="flex flex-wrap gap-3">
        <div class="flex align-items-center">
          <RadioButton
            v-model="domainOption"
            inputId="filter-domain"
            name="filter domain"
            value="0"
          />
          <label
            for="filter-domain"
            class="ml-2"
            >Filter Domains</label
          >
        </div>
        <div class="flex align-items-center">
          <RadioButton
            v-model="domainOption"
            inputId="all-domain"
            name="all domain"
            value="1"
          />
          <label
            for="all-domain"
            class="ml-2"
            >All Domains</label
          >
        </div>
      </div>

      <div v-if="domainOption === '0'">
        <label>Domains:</label>
        <PickList
          v-model="listDomains"
          listStyle="height:342px"
          dataKey="domainID"
          breakpoint="1400px"
        >
          <template #sourceheader>Available Domains</template>
          <template #targetheader>Chosen Domains</template>
          <template #item="slotProps">
            <div class="flex flex-wrap p-2 align-items-center gap-3">
              <div class="flex-1 flex flex-column gap-2">
                <span class="font-bold">{{ slotProps.item.name }}</span>
              </div>
            </div>
          </template>
        </PickList>
      </div>

      <!-- destionation -->
      <h1>Destination</h1>
      <label>Endpoint Type: *</label>
      <Dropdown
        :class="{ 'p-invalid': errors.template }"
        v-model="endpoint"
        :options="listEndpoint"
        optionLabel="label"
        optionValue="value"
        class="w-full"
      />

      <!-- Specific Sections for Different Endpoints -->
      <div
        id="standard"
        class="flex flex-col gap-3"
        v-if="endpoint === 'standard'"
      >
        <label>Endpoint URL: *</label>
        <InputText
          v-model="endpointUrl"
          type="text"
          placeholder="https://app.domain.com/"
          :class="{ 'p-invalid': errors.endpointUrl }"
          v-tooltip.top="errors.endpointUrl"
        />

        <label>Custom Headers:</label>
        <div
          class="p-inputgroup flex-1"
          v-for="(header, index) in headers"
          :key="index"
        >
          <InputText
            v-model="header.value"
            type="text"
            placeholder="header-name: value"
          />
          <ButtonPrimer
            icon="pi pi-times"
            severity="danger"
            v-if="header.deleted && index != 0"
            @click="removeHeader(index)"
          />
        </div>
        <ButtonPrimer
          label="Header"
          @click="addHeader()"
        />

        <h1>Payload</h1>

        <label>Max Size:</label>
        <InputNumber
          v-model="maxSize"
          placeholder="1000000"
          :useGrouping="false"
          :class="{ 'p-invalid': errors.maxSize }"
          v-tooltip.top="errors.maxSize"
        />

        <label>Log Line Separator:</label>
        <InputText
          v-model="lineSeparator"
          type="text"
          placeholder="\n"
          :class="{ 'p-invalid': errors.lineSeparator }"
          v-tooltip.top="errors.lineSeparator"
        />

        <label>Payload Format:</label>
        <InputText
          v-model="payloadFormat"
          type="text"
          placeholder="$dataset"
          :class="{ 'p-invalid': errors.payloadFormat }"
          v-tooltip.top="errors.payloadFormat"
        />
      </div>

      <div
        id="kafka"
        class="flex flex-col gap-3"
        v-if="endpoint === 'kafka'"
      >
        <label>Bootstrap Servers: *</label>
        <InputText
          v-model="bootstrapServers"
          type="text"
          placeholder="host1:port1,host2:port2,..."
          :class="{ 'p-invalid': errors.bootstrapServers }"
          v-tooltip.top="errors.bootstrapServers"
        />

        <label>Kafka Topic:</label>
        <InputText
          v-model="kafkaTopic"
          type="text"
          :class="{ 'p-invalid': errors.kafkaTopic }"
          v-tooltip.top="errors.kafkaTopic"
        />

        <label>Use Transport Layer Security (TLS):</label>
        <div class="flex flex-wrap gap-3">
          <div class="flex align-items-center">
            <RadioButton
              v-model="tlsOption"
              inputId="no"
              name="No"
              :value="false"
            />
            <label
              for="no"
              class="ml-2"
              >No</label
            >
          </div>
          <div class="flex align-items-center">
            <RadioButton
              v-model="tlsOption"
              inputId="yes"
              name="Yes"
              :value="true"
            />
            <label
              for="yes"
              class="ml-2"
              >Yes</label
            >
          </div>
        </div>
      </div>

      <div
        id="s3"
        class="flex flex-col gap-3"
        v-if="endpoint === 's3'"
      >
        <label>Host URL: *</label>
        <InputText
          v-model="host"
          type="text"
          :class="{ 'p-invalid': errors.host }"
          v-tooltip.top="errors.host"
        />

        <label>Bucket Name: *</label>
        <InputText
          v-model="bucket"
          type="text"
          :class="{ 'p-invalid': errors.bucket }"
          v-tooltip.top="errors.bucket"
        />

        <label>Region: *</label>
        <InputText
          v-model="region"
          type="text"
          :class="{ 'p-invalid': errors.region }"
          v-tooltip.top="errors.region"
        />

        <label>Access Key: *</label>
        <InputText
          v-model="accessKey"
          type="text"
          :class="{ 'p-invalid': errors.accessKey }"
          v-tooltip.top="errors.accessKey"
        />

        <label>Secret Key: *</label>
        <InputText
          v-model="secretKey"
          type="text"
          :class="{ 'p-invalid': errors.secretKey }"
          v-tooltip.top="errors.secretKey"
        />

        <label>Object Key Prefix:</label>
        <InputText
          v-model="objectKey"
          type="text"
          :class="{ 'p-invalid': errors.objectKey }"
          v-tooltip.top="errors.objectKey"
        />

        <label>Content Type:</label>
        <Dropdown
          :class="{ 'p-invalid': errors.contentType }"
          v-model="contentType"
          :options="listContentType"
          optionLabel="label"
          optionValue="value"
          class="w-full"
        />
      </div>

      <div
        id="big_query"
        class="flex flex-col gap-3"
        v-if="endpoint === 'big_query'"
      >
        <label>Project ID: *</label>
        <InputText
          v-model="projectID"
          type="text"
          :class="{ 'p-invalid': errors.projectID }"
          v-tooltip.top="errors.projectID"
        />

        <label>Dataset ID: *</label>
        <InputText
          v-model="datasetID"
          type="text"
          :class="{ 'p-invalid': errors.datasetID }"
          v-tooltip.top="errors.datasetID"
        />

        <label>Table ID: *</label>
        <InputText
          v-model="tableID"
          type="text"
          :class="{ 'p-invalid': errors.tableID }"
          v-tooltip.top="errors.tableID"
        />

        <label>Service Account Key: *</label>
        <Textarea
          v-model="serviceAccountKey"
          :class="{ 'p-invalid': errors.serviceAccountKey }"
          v-tooltip.top="errors.serviceAccountKey"
          rows="5"
          cols="30"
        />
      </div>

      <div
        id="elasticsearch"
        class="flex flex-col gap-3"
        v-if="endpoint === 'elasticsearch'"
      >
        <label>Elasticsearch URL: *</label>
        <InputText
          v-model="elasticsearchUrl"
          type="text"
          placeholder="https://elasticsearch-domain.com/index"
          :class="{ 'p-invalid': errors.elasticsearchUrl }"
          v-tooltip.top="errors.elasticsearchUrl"
        />

        <label>API Key: *</label>
        <InputText
          v-model="apiKey"
          type="text"
          :class="{ 'p-invalid': errors.apiKey }"
          v-tooltip.top="errors.apiKey"
        />
      </div>

      <div
        id="splunk"
        class="flex flex-col gap-3"
        v-if="endpoint === 'splunk'"
      >
        <label>Splunk URL: *</label>
        <InputText
          v-model="splunkUrl"
          type="text"
          placeholder="https://inputs.splunk-client.splunkcloud.com:123456/services/collector"
          :class="{ 'p-invalid': errors.splunkUrl }"
          v-tooltip.top="errors.splunkUrl"
        />

        <label>API Key: *</label>
        <InputText
          v-model="splunkApiKey"
          type="text"
          :class="{ 'p-invalid': errors.splunkApiKey }"
          v-tooltip.top="errors.splunkApiKey"
        />
      </div>

      <div
        id="aws_kinesis_firehose"
        class="flex flex-col gap-3"
        v-if="endpoint === 'aws_kinesis_firehose'"
      >
        <label>Stream Name: *</label>
        <InputText
          v-model="streamName"
          type="text"
          :class="{ 'p-invalid': errors.streamName }"
          v-tooltip.top="errors.streamName"
        />

        <label>Region: *</label>
        <InputText
          v-model="awsRegion"
          type="text"
          :class="{ 'p-invalid': errors.awsRegion }"
          v-tooltip.top="errors.awsRegion"
        />

        <label>Access Key: *</label>
        <InputText
          v-model="awsAccessKey"
          type="text"
          :class="{ 'p-invalid': errors.awsAccessKey }"
          v-tooltip.top="errors.awsAccessKey"
        />

        <label>Secret Key: *</label>
        <InputText
          v-model="awsSecretKey"
          type="text"
          :class="{ 'p-invalid': errors.awsSecretKey }"
          v-tooltip.top="errors.awsSecretKey"
        />
      </div>

      <div
        id="datadog"
        class="flex flex-col gap-3"
        v-if="endpoint === 'datadog'"
      >
        <label>Datadog URL: *</label>
        <InputText
          v-model="datadogUrl"
          type="text"
          placeholder="https://http-intake.logs.datadoghq.com/v1/input"
          :class="{ 'p-invalid': errors.datadogUrl }"
          v-tooltip.top="errors.datadogUrl"
        />

        <label>API Key: *</label>
        <InputText
          v-model="datadogApiKey"
          type="text"
          :class="{ 'p-invalid': errors.datadogApiKey }"
          v-tooltip.top="errors.datadogApiKey"
        />
      </div>

      <div
        id="qradar"
        class="flex flex-col gap-3"
        v-if="endpoint === 'qradar'"
      >
        <label>QRadar URL: *</label>
        <InputText
          v-model="QRadarUrl"
          type="text"
          placeholder="https://qradar-trial-abcdef.qradar.ibmcloud.com:123456"
          :class="{ 'p-invalid': errors.QRadarUrl }"
          v-tooltip.top="errors.QRadarUrl"
        />
      </div>

      <div
        id="azure_monitor"
        class="flex flex-col gap-3"
        v-if="endpoint === 'azure_monitor'"
      >
        <label>Log Type: *</label>
        <InputText
          v-model="logType"
          type="text"
          :class="{ 'p-invalid': errors.logType }"
          v-tooltip.top="errors.logType"
        />

        <label>Shared Key: *</label>
        <InputText
          v-model="sharedKey"
          type="text"
          :class="{ 'p-invalid': errors.sharedKey }"
          v-tooltip.top="errors.sharedKey"
        />

        <label>Time Generated Field:</label>
        <InputText
          v-model="generatedField"
          type="text"
          :class="{ 'p-invalid': errors.generatedField }"
          v-tooltip.top="errors.generatedField"
        />

        <label>Workspace ID: *</label>
        <InputText
          v-model="workspaceID"
          type="text"
          :class="{ 'p-invalid': errors.workspaceID }"
          v-tooltip.top="errors.workspaceID"
        />
      </div>

      <div
        id="azure_blob_storage"
        class="flex flex-col gap-3"
        v-if="endpoint === 'azure_blob_storage'"
      >
        <label>Storage Account: *</label>
        <InputText
          v-model="storageAccount"
          type="text"
          :class="{ 'p-invalid': errors.storageAccount }"
          v-tooltip.top="errors.storageAccount"
        />

        <label>Container Name: *</label>
        <InputText
          v-model="containerName"
          type="text"
          :class="{ 'p-invalid': errors.containerName }"
          v-tooltip.top="errors.containerName"
        />

        <label>Blob SAS Token: *</label>
        <InputText
          v-model="blobToken"
          type="text"
          :class="{ 'p-invalid': errors.blobToken }"
          v-tooltip.top="errors.blobToken"
        />
      </div>
    </template>
  </EditFormBlock>
</template>

<script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { useForm, useField } from 'vee-validate'
  import * as yup from 'yup'

  // Import the components
  import EditFormBlock from '@/templates/edit-form-block'
  import Dropdown from 'primevue/dropdown'
  import RadioButton from 'primevue/radiobutton'
  import PickList from 'primevue/picklist'
  import InputText from 'primevue/inputtext'
  import ButtonPrimer from 'primevue/button'
  import InputNumber from 'primevue/inputnumber'
  import Textarea from 'primevue/textarea'

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
  const listDomains = ref([])
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

    // standard
    endpointUrl: yup.string().when('endpoint', {
      is: 'standard',
      then: (schema) => schema.required('endpoint url is a required field')
    }),
    headers: yup.array().of(
      yup.object().shape({
        value: yup.string().when('endpoint', {
          is: 'standard',
          then: (schema) => schema.required('header value is required')
        })
      })
    ),
    maxSize: yup.number().when('endpoint', {
      is: 'standard',
      then: (schema) => schema.required('max size is a required field')
    }),
    lineSeparator: yup.string().when('endpoint', {
      is: 'standard',
      then: (schema) => schema.required('log line separator is a required field')
    }),
    payloadFormat: yup.string().when('endpoint', {
      is: 'standard',
      then: (schema) => schema.required('payload format is a required field')
    }),

    // Kafka
    bootstrapServers: yup.string().when('endpoint', {
      is: 'kafka',
      then: (schema) => schema.max(150).required('bootstrap servers is a required field')
    }),
    kafkaTopic: yup.string().when('endpoint', {
      is: 'kafka',
      then: (schema) => schema.max(150).required('kafka topic is a required field')
    }),

    // s3
    host: yup.string().when('endpoint', {
      is: 's3',
      then: (schema) => schema.max(200).required('host is a required field')
    }),
    bucket: yup.string().when('endpoint', {
      is: 's3',
      then: (schema) => schema.max(150).required('bucket is a required field')
    }),
    region: yup.string().when('endpoint', {
      is: 's3',
      then: (schema) => schema.max(50).required('region is a required field')
    }),
    accessKey: yup.string().when('endpoint', {
      is: 's3',
      then: (schema) => schema.max(150).required('access key is a required field')
    }),
    secretKey: yup.string().when('endpoint', {
      is: 's3',
      then: (schema) => schema.max(150).required('secret key is a required field')
    }),
    objectKey: yup.string().when('endpoint', {
      is: 's3',
      then: (schema) => schema.max(150).required('object key prefix is a required field')
    }),

    // google big query
    projectID: yup.string().when('endpoint', {
      is: 'big_query',
      then: (schema) => schema.required('Project id is a required field')
    }),
    datasetID: yup.string().when('endpoint', {
      is: 'big_query',
      then: (schema) => schema.required('dataset id is a required field')
    }),
    tableID: yup.string().when('endpoint', {
      is: 'big_query',
      then: (schema) => schema.required('table id is a required field')
    }),
    serviceAccountKey: yup.string().when('endpoint', {
      is: 'big_query',
      then: (schema) => schema.required('service account key is a required field')
    }),

    // elasticsearch
    elasticsearchUrl: yup.string().when('endpoint', {
      is: 'elasticsearch',
      then: (schema) => schema.required('elasticsearch url is a required field')
    }),
    apiKey: yup.string().when('endpoint', {
      is: 'elasticsearch',
      then: (schema) => schema.required('api key is a required field')
    }),

    // splunk
    splunkUrl: yup.string().when('endpoint', {
      is: 'splunk',
      then: (schema) => schema.required('splunk url is a required field')
    }),
    splunkApiKey: yup.string().when('endpoint', {
      is: 'splunk',
      then: (schema) => schema.required('api key is a required field')
    }),

    // aws_kinesis_firehose
    streamName: yup.string().when('endpoint', {
      is: 'aws_kinesis_firehose',
      then: (schema) => schema.required('stream name is a required field')
    }),
    awsRegion: yup.string().when('endpoint', {
      is: 'aws_kinesis_firehose',
      then: (schema) => schema.required('region is a required field')
    }),
    awsAccessKey: yup.string().when('endpoint', {
      is: 'aws_kinesis_firehose',
      then: (schema) => schema.required('access key is a required field')
    }),
    awsSecretKey: yup.string().when('endpoint', {
      is: 'aws_kinesis_firehose',
      then: (schema) => schema.required('secret key is a required field')
    }),

    // datadog
    datadogUrl: yup.string().when('endpoint', {
      is: 'datadog',
      then: (schema) => schema.required('datadog url is a required field')
    }),
    datadogApiKey: yup.string().when('endpoint', {
      is: 'datadog',
      then: (schema) => schema.required('api key is a required field')
    }),

    // QRadar
    QRadarUrl: yup.string().when('endpoint', {
      is: 'qradar',
      then: (schema) => schema.required('qradar url is a required field')
    }),

    // azure_monitor
    logType: yup.string().when('endpoint', {
      is: 'azure_monitor',
      then: (schema) => schema.required('log type is a required field')
    }),
    sharedKey: yup.string().when('endpoint', {
      is: 'azure_monitor',
      then: (schema) => schema.required('shared key is a required field')
    }),
    workspaceID: yup.string().when('endpoint', {
      is: 'azure_monitor',
      then: (schema) => schema.required('workspace id is a required field')
    }),

    // azure_blob_storage
    storageAccount: yup.string().when('endpoint', {
      is: 'azure_blob_storage',
      then: (schema) => schema.required('storage account is a required field')
    }),
    containerName: yup.string().when('endpoint', {
      is: 'azure_blob_storage',
      then: (schema) => schema.required('container name is a required field')
    }),
    blobToken: yup.string().when('endpoint', {
      is: 'azure_blob_storage',
      then: (schema) => schema.required('blob sas token is a required field')
    })
  })

  const { setValues, errors, meta, values } = useForm({
    validationSchema,
    initialValues: {
      name: '',
      dataSource: 'http',
      template: '',
      dataSet: '',
      domainOption: '1',
      endpoint: '',

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
      contentType: { label: 'plain/text', value: 'plain/text' },

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
  const { value: endpoint } = useField('endpoint')

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

  let formValues = { ...values, listDomains }

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
    const domains = await props.listDataStreamingDomainsService()
    if (domainOption.value === '0') {
      listDomains.value = [[], domains]
    } else {
      listDomains.value = [domains, []]
    }
  }

  const addHeader = () => {
    headers.value.push({ value: '', deleted: true })
  }

  const removeHeader = (index) => {
    headers.value.splice(index, 1)
  }

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
        if (listDomains.value[1].length > 0) {
          listDomains.value[1].forEach((element) => {
            listDomains.value[0].push(element)
          })
          listDomains.value[1] = []
        }
      }
    }
  )

  watch([values, listDomains], () => {
    console.log(listDomains.value)
    formValues = { ...values, domains: listDomains.value[1] }
  })
</script>
