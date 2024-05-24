import * as Errors from '@/services/axios/errors'
import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeDataStreamBaseUrl } from './make-data-stream-base-url'

export const createDataStreamService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDataStreamBaseUrl()}`,
    method: 'POST',
    body: adapt(payload)
  })

  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  const allDomains = payload.domains[1].length <= 0
  let parsedPayload;

  if (payload.template === 'CUSTOM_TEMPLATE') {
    parsedPayload = {
      name: payload.name,
      template_model: payload.dataSet,
      all_domains: allDomains,
      domain_ids: allDomains ? [] : getDomains(payload.domains[1]),
      endpoint: parseByEndpointType(payload)
    }
  } else {
    parsedPayload = {
      name: payload.name,
      template_id: payload.template,
      data_source: payload.dataSource,
      domain_ids: allDomains ? [] : getDomains(payload.domains[1]),
      all_domains: allDomains,
      active: payload.status,
      endpoint: parseByEndpointType(payload)
    }
  }

  if (payload.hasSampling) {
    parsedPayload.sampling_percentage = payload.samplingPercentage
  }

  return parsedPayload
}

const parseByEndpointType = (payload) => {
  switch (payload.endpoint) {
    case 'standard':
      return {
        endpoint_type: 'standard',
        url: payload.endpointUrl,
        payload_format: payload.payloadFormat,
        log_line_separator: payload.lineSeparator === '\\n' ? '\n' : payload.lineSeparator,
        max_size: payload.maxSize,
        headers: getHeaders(payload.headers)
      }
    case 'kafka':
      return {
        endpoint_type: 'kafka',
        kafka_topic: payload.kafkaTopic,
        bootstrap_servers: payload.bootstrapServers
      }
    case 's3':
      return {
        endpoint_type: 's3',
        access_key: payload.accessKey,
        region: payload.region,
        object_key_prefix: payload.objectKey,
        bucket_name: payload.bucket,
        content_type: payload.contentType,
        host_url: payload.host,
        secret_key: payload.secretKey
      }
    case 'big_query':
      return {
        endpoint_type: 'big_query',
        dataset_id: payload.datasetID,
        project_id: payload.projectID,
        table_id: payload.tableID,
        service_account_key: payload.serviceAccountKey
      }
    case 'elasticsearch':
      return {
        endpoint_type: 'elasticsearch',
        url: payload.elasticsearchUrl,
        api_key: payload.apiKey
      }
    case 'splunk':
      return {
        endpoint_type: 'splunk',
        url: payload.splunkUrl,
        api_key: payload.splunkApiKey
      }
    case 'aws_kinesis_firehose':
      return {
        endpoint_type: 'aws_kinesis_firehose',
        access_key: payload.awsAccessKey,
        stream_name: payload.streamName,
        region: payload.awsRegion,
        secret_key: payload.awsSecretKey
      }
    case 'datadog':
      return {
        endpoint_type: 'datadog',
        url: payload.datadogUrl,
        api_key: payload.datadogApiKey
      }
    case 'qradar':
      return {
        endpoint_type: 'qradar',
        url: payload.QRadarUrl
      }
    case 'azure_monitor':
      return {
        endpoint_type: 'azure_monitor',
        log_type: payload.logType,
        shared_key: payload.sharedKey,
        time_generated_field: payload.generatedField,
        workspace_id: payload.workspaceID
      }
    case 'azure_blob_storage':
      return {
        endpoint_type: 'azure_blob_storage',
        storage_account: payload.storageAccount,
        container_name: payload.containerName,
        blob_sas_token: payload.blobToken
      }
    default:
      throw new Errors.InvalidDataStreamEndpointType().message
  }
}

const getDomains = (domains) => {
  return domains.map((domain) => domain.domainID)
}

const getHeaders = (listHeaders) => {
  const headers = {}
  if (listHeaders.length > 0) {
    listHeaders.forEach((element) => {
      if (element.value.trim().length > 0) {
        const [key, ...rest] = element.value.includes(':')
          ? element.value.split(':')
          : [element.value]
        const headerKey = key.trim()
        headers[headerKey] = rest.length > 0 ? rest.join(':').trim() : headerKey
      }
    })
  }
  return headers
}

const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 201:
      return {
        feedback: 'Your data stream has been created',
        urlToEditView: `/data-stream`
      }
    case 400:
      const apiError = extractApiError(httpResponse)
      throw new Error(apiError)
    case 401:
      throw new Errors.InvalidApiTokenError().message
    case 403:
      throw new Errors.PermissionError().message
    case 404:
      throw new Errors.NotFoundError().message
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Errors.UnexpectedError().message
  }
}

/**
 * @param {Object} errorSchema - The error schema.
 * @param {string} key - The error key of error schema.
 * @returns {string|undefined} The result message based on the status code.
 */
const extractErrorKey = (errorSchema, key) => {
  return errorSchema[key]
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @returns {string} The result message based on the status code.
 */
const extractApiError = (httpResponse) => {
  //flag
  const noFlagError = extractErrorKey(httpResponse.body, 'user_has_no_flag')

  // standard
  const invalidURLError = extractErrorKey(httpResponse.body, 'invalid_url')
  const maxSizeError = extractErrorKey(httpResponse.body, 'max_size_out_of_range')
  const datasetError = extractErrorKey(httpResponse.body, 'payload_format_without_dataset')

  // kafka
  const invalidBootstrapServersError = extractErrorKey(
    httpResponse.body,
    'invalid_bootstrap_servers'
  )

  // s3
  const invalidHostURLError = extractErrorKey(httpResponse.body, 'invalid_host_url')

  // google big query
  const invalidServiceAccountError = extractErrorKey(
    httpResponse.body,
    'invalid_service_account_key'
  )

  // elasticsearch
  const elasticInvalidURLError = extractErrorKey(httpResponse.body, 'invalid_url')

  // Datadog
  const datadogInvalidURLError = extractErrorKey(httpResponse.body, 'invalid_datadog_url')

  const errorMessages = [
    noFlagError,
    invalidURLError,
    maxSizeError,
    datasetError,
    invalidBootstrapServersError,
    invalidHostURLError,
    invalidServiceAccountError,
    elasticInvalidURLError,
    datadogInvalidURLError
  ]
  const errorMessage = errorMessages.find((error) => !!error)
  return errorMessage
}
