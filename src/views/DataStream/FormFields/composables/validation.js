import * as yup from 'yup'

const validationSchema = yup.object({
  name: yup.string().required('Name is a required field'),
  dataSource: yup.string().required(),
  template: yup.string().required(),
  dataSet: yup.string(),
  domainOption: yup.string().required(),
  endpoint: yup.string().required(),
  status: yup.boolean(),
  hasSampling: yup.boolean(),
  samplingPercentage: yup.number().when('hasSampling', {
    is: true,
    then: (schema) =>
      schema
        .test('minmax', 'Sampling Percentage must be between 0 and 100', (value) => {
          return value >= 0 && value <= 100
        })
        .required('Sampling Percentage is a required field')
  }),

  // standard
  endpointUrl: yup.string().when('endpoint', {
    is: 'standard',
    then: (schema) =>
      schema.required('Endpoint URL is a required field').url('Please enter a valid URL')
  }),
  headers: yup.array().of(
    yup.object().shape({
      value: yup.string().when('endpoint', {
        is: 'standard',
        then: (schema) =>
          schema
            .required('Header value is required')
            .test('header-format', 'Header must be in format "header-name:value"', (value) => {
              return value && value.includes(':')
            })
      })
    })
  ),
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
  useTls: yup.boolean(),
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
    then: (schema) => schema.max(150)
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
    then: (schema) => schema.required('Encoded API Key is a required field')
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

export { validationSchema }
