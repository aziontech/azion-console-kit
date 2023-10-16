import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeDataStreamingBaseUrl } from './make-data-streaming-base-url'

export const loadDataStreamingService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDataStreamingBaseUrl()}/${id}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const payload = httpResponse.body.results
  const parsedVariable = {
    id: payload.id,
    name: payload.name,
    template: payload.template_id,
    dataSource: payload.data_source,
    domainOption: payload.all_domains ?  '1' : '0',
    endpoint: payload.endpoint.endpoint_type,
    ...getInfoByEndpoint(payload)
  }

  return {
    body: parsedVariable,
    statusCode: httpResponse.statusCode
  }
}

const getInfoByEndpoint = (payload) => {
  switch (payload.endpoint.endpoint_type) {
    case 'standard':
      return {
        endpointUrl: payload.endpoint.url,
        payloadFormat: payload.endpoint.payload_format,
        lineSeparator: payload.endpoint.log_line_separator,
        maxSize: payload.endpoint.max_size
      }
    case 'kafka':
      return {
        kafkaTopic: payload.endpoint.kafka_topic,
        bootstrapServers: payload.endpoint.bootstrap_servers
      }
    case 's3':
      return {
        accessKey: payload.endpoint.access_key,
        region: payload.endpoint.region,
        objectKey: payload.endpoint.object_key_prefix,
        bucket: payload.endpoint.bucket_name,
        contentType: payload.endpoint.content_type,
        host: payload.endpoint.host_url,
        secretKey: payload.endpoint.secret_key
      }
    case 'big_query':
      return {
        datasetID: payload.endpoint.dataset_id,
        projectID: payload.endpoint.project_id,
        tableID: payload.endpoint.table_id,
        serviceAccountKey: payload.endpoint.service_account_key
      }
    case 'elasticsearch':
      return {
        elasticsearchUrl: payload.endpoint.url,
        apiKey: payload.endpoint.api_key
      }
    case 'splunk':
      return {
        splunkUrl: payload.endpoint.url,
        splunkApiKey: payload.endpoint.api_key
      }
    case 'aws_kinesis_firehose':
      return {
        awsAccessKey: payload.endpoint.access_key,
        streamName: payload.endpoint.stream_name,
        awsRegion: payload.endpoint.region,
        awsSecretKey: payload.endpoint.secret_key
      }
    case 'datadog':
      return {
        datadogUrl: payload.endpoint.url,
        datadogApiKey: payload.endpoint.api_key
      }
    case 'qradar':
      return {
        QRadarUrl: payload.endpoint.url
      }
    case 'azure_monitor':
      return {
        logType: payload.endpoint.log_type,
        sharedKey: payload.endpoint.shared_key,
        generatedField: payload.endpoint.time_generated_field,
        workspaceID: payload.endpoint.workspace_id
      }
    case 'azure_blob_storage':
      return {
        storageAccount: payload.endpoint.storage_account,
        containerName: payload.endpoint.container_name,
        blobToken: payload.endpoint.blob_sas_token
      }
    default:
      return {}
  }
}
