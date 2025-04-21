import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeDataStreamBaseUrl } from './make-data-stream-base-url'
import { listWorkloadsService } from '@/services/workloads-services/list-workloads-service'
import { extractApiError } from '@/helpers/extract-api-error'

export const loadDataStreamService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDataStreamBaseUrl()}/${id}`,
    method: 'GET'
  })
  httpResponse = await adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = async (httpResponse) => {
  if (httpResponse.statusCode !== 200) {
    throw new Error(extractApiError({ body: httpResponse.body })).message
  }

  const payload = httpResponse.body.data
  const workloads = await handlesWorkloads(payload.filters.workloads)

  const parsedVariable = {
    id: payload.id,
    name: payload.name,
    template: payload.data_set_id ?? 'CUSTOM_TEMPLATE',
    dataSet: payload?.data_set,
    dataSource: payload.data_source,
    domains: workloads,
    domainOption: payload.filters.sampling_enable ? '1' : '0',
    status: payload.active,
    filters: payload.filters,
    endpoint: payload.endpoint.endpoint_type,
    hasSampling: payload.filters.sampling_enable,
    samplingPercentage: payload.filters.sampling_rate,
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
        lineSeparator:
          payload.endpoint.log_line_separator === '\n'
            ? '\\n'
            : payload.endpoint.log_line_separator,
        maxSize: payload.endpoint.max_size,
        ...getHeaders(payload)
      }
    case 'kafka':
      return {
        kafkaTopic: payload.endpoint.kafka_topic,
        bootstrapServers: payload.endpoint.bootstrap_servers,
        useTls: payload.endpoint.use_tls
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

const getHeaders = (payload) => {
  const headers = []
  if (payload.endpoint && payload.endpoint?.headers) {
    Object.entries(payload.endpoint?.headers).forEach((element) => {
      headers.push({ value: `${element[0]}: ${element[1]}`, deleted: true })
    })
  }

  return {
    headers: headers
  }
}

const handlesWorkloads = async (workloadsIds) => {
  const pageSize = 100
  let page = 1
  let allWorkloads = []
  let fetchedAll = false

  const idsToFind = new Set(workloadsIds)
  const foundMap = new Map()

  while (!fetchedAll && foundMap.size < workloadsIds.length) {
    const response = await listWorkloadsService({ page, page_size: pageSize })
    const results = response.results

    allWorkloads = [...allWorkloads, ...results]

    results.forEach((workload) => {
      if (idsToFind.has(workload.id)) {
        foundMap.set(workload.id, workload)
      }
    })

    if (results.length < pageSize) {
      fetchedAll = true
    }

    page++
  }

  const found = Array.from(foundMap.values())

  const notFoundIds = allWorkloads.filter((workload) => !workloadsIds.includes(workload.id))

  return [notFoundIds, found]
}
