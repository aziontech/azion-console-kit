import { parseStatusData } from '../utils/adapter/parse-status-utils'
import * as Errors from '@/services/axios/errors'

const mapDataSourceName = {
  http: 'Edge Applications',
  rtm_activity: 'Activity History',
  cells_console: 'Edge Functions',
  waf: 'WAF Events'
}

const getDomains = (domains) => {
  return domains.map((domain) => domain.id)
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

const getHeadersLoad = (payload) => {
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
        bootstrap_servers: payload.bootstrapServers,
        use_tls: payload.useTls
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
        ...getHeadersLoad(payload)
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

export const DataStreamAdapter = {
  transformListDataStream(data) {
    return (
      data?.map((dataStream) => {
        return {
          id: dataStream.id,
          name: dataStream.name,
          templateName: dataStream.templateName,
          dataSource: mapDataSourceName[dataStream.data_source],
          endpointType: dataStream.endpoint.endpoint_type,
          active: parseStatusData(dataStream.active)
        }
      }) || []
    )
  },
  transformListTemplate(data) {
    return (
      data?.map((template) => {
        return {
          id: template.id,
          name: template.name,
          dataSet: template.data_set
        }
      }) || []
    )
  },
  transformPayloadDataStream(payload) {
    const allDomains = payload.domains[1].length <= 0
    let parsedPayload

    if (payload.template === 'CUSTOM_TEMPLATE') {
      parsedPayload = {
        name: payload.name,
        template_model: JSON.stringify(JSON.parse(payload.dataSet), null, '\t'),
        filters: {
          sampling_enable: allDomains,
          sampling_rate: 100,
          workloads: getDomains(payload.domains[1])
        },
        endpoint: parseByEndpointType(payload)
      }
    } else {
      parsedPayload = {
        name: payload.name,
        data_set_id: payload.template,
        data_source: payload.dataSource,
        filters: {
          sampling_enable: allDomains,
          sampling_rate: 100,
          workloads: getDomains(payload.domains[1])
        },
        active: payload.status,
        endpoint: parseByEndpointType(payload)
      }
    }

    if (payload.hasSampling) {
      parsedPayload.filters.sampling_rate = payload.samplingPercentage
    }

    return parsedPayload
  },
  transformLoadDataStream(datas) {
    const [payload, workloads] = datas
    return {
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
  }
}
