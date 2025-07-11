import { parseStatusData } from '../utils/adapter/parse-status-utils'
import * as Errors from '@/services/axios/errors'

const mapDataSourceName = {
  http: 'Edge Applications',
  activity: 'Activity History',
  functions: 'Edge Functions',
  waf: 'WAF Events'
}

const endpointTypeNameMap = {
  standard: 'HTTP',
  kafka: 'Kafka',
  s3: 'Amazon S3',
  big_query: 'BigQuery',
  elasticsearch: 'Elasticsearch',
  splunk: 'Splunk',
  aws_kinesis_firehose: 'AWS Kinesis Firehose',
  datadog: 'Datadog',
  qradar: 'QRadar',
  azure_monitor: 'Azure Monitor',
  azure_blob_storage: 'Azure Blob Storage'
}

const getWorkloadIds = (workloads) => {
  return workloads.map((workload) => workload.id)
}

const getHeadersPostRequest = (listHeaders) => {
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

const getHeadersLoadRequest = (payload) => {
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
        type: 'standard',
        attributes: {
          url: payload.endpointUrl,
          payload_format: payload.payloadFormat,
          log_line_separator: payload.lineSeparator === '\\n' ? '\n' : payload.lineSeparator,
          max_size: payload.maxSize,
          headers: getHeadersPostRequest(payload.headers)
        }
      }
    case 'kafka':
      return {
        type: 'kafka',
        attributes: {
          kafka_topic: payload.kafkaTopic,
          bootstrap_servers: payload.bootstrapServers,
          use_tls: payload.useTls
        }
      }
    case 's3':
      return {
        type: 's3',
        attributes: {
          access_key: payload.accessKey,
          region: payload.region,
          object_key_prefix: payload.objectKey,
          bucket_name: payload.bucket,
          content_type: payload.contentType,
          host_url: payload.host,
          secret_key: payload.secretKey
        }
      }
    case 'big_query':
      return {
        type: 'big_query',
        attributes: {
          dataset_id: payload.datasetID,
          project_id: payload.projectID,
          table_id: payload.tableID,
          service_account_key: payload.serviceAccountKey
        }
      }
    case 'elasticsearch':
      return {
        type: 'elasticsearch',
        attributes: {
          url: payload.elasticsearchUrl,
          api_key: payload.apiKey
        }
      }
    case 'splunk':
      return {
        type: 'splunk',
        attributes: {
          url: payload.splunkUrl,
          api_key: payload.splunkApiKey
        }
      }
    case 'aws_kinesis_firehose':
      return {
        type: 'aws_kinesis_firehose',
        attributes: {
          access_key: payload.awsAccessKey,
          stream_name: payload.streamName,
          region: payload.awsRegion,
          secret_key: payload.awsSecretKey
        }
      }
    case 'datadog':
      return {
        type: 'datadog',
        attributes: {
          url: payload.datadogUrl,
          api_key: payload.datadogApiKey
        }
      }
    case 'qradar':
      return {
        type: 'qradar',
        attributes: {
          url: payload.QRadarUrl
        }
      }
    case 'azure_monitor':
      return {
        type: 'azure_monitor',
        attributes: {
          log_type: payload.logType,
          shared_key: payload.sharedKey,
          time_generated_field: payload.generatedField,
          workspace_id: payload.workspaceID
        }
      }
    case 'azure_blob_storage':
      return {
        type: 'azure_blob_storage',
        attributes: {
          storage_account: payload.storageAccount,
          container_name: payload.containerName,
          blob_sas_token: payload.blobToken
        }
      }
    default:
      throw new Errors.InvalidDataStreamEndpointType().message
  }
}

const getInfoByEndpoint = (payload) => {
  const endpointAttributes = payload.attributes

  switch (payload.type) {
    case 'standard':
      return {
        endpointUrl: endpointAttributes.url,
        payloadFormat: endpointAttributes.payload_format,
        lineSeparator:
          endpointAttributes.log_line_separator === '\n'
            ? '\\n'
            : endpointAttributes.log_line_separator,
        maxSize: endpointAttributes.max_size,
        ...getHeadersLoadRequest(payload)
      }
    case 'kafka':
      return {
        kafkaTopic: endpointAttributes.kafka_topic,
        bootstrapServers: endpointAttributes.bootstrap_servers,
        useTls: endpointAttributes.use_tls
      }
    case 's3':
      return {
        accessKey: endpointAttributes.access_key,
        region: endpointAttributes.region,
        objectKey: endpointAttributes.object_key_prefix,
        bucket: endpointAttributes.bucket_name,
        contentType: endpointAttributes.content_type,
        host: endpointAttributes.host_url,
        secretKey: endpointAttributes.secret_key
      }
    case 'big_query':
      return {
        datasetID: endpointAttributes.dataset_id,
        projectID: endpointAttributes.project_id,
        tableID: endpointAttributes.table_id,
        serviceAccountKey: endpointAttributes.service_account_key
      }
    case 'elasticsearch':
      return {
        elasticsearchUrl: endpointAttributes.url,
        apiKey: endpointAttributes.api_key
      }
    case 'splunk':
      return {
        splunkUrl: endpointAttributes.url,
        splunkApiKey: endpointAttributes.api_key
      }
    case 'aws_kinesis_firehose':
      return {
        awsAccessKey: endpointAttributes.access_key,
        streamName: endpointAttributes.stream_name,
        awsRegion: endpointAttributes.region,
        awsSecretKey: endpointAttributes.secret_key
      }
    case 'datadog':
      return {
        datadogUrl: endpointAttributes.url,
        datadogApiKey: endpointAttributes.api_key
      }
    case 'qradar':
      return {
        QRadarUrl: endpointAttributes.url
      }
    case 'azure_monitor':
      return {
        logType: endpointAttributes.log_type,
        sharedKey: endpointAttributes.shared_key,
        generatedField: endpointAttributes.time_generated_field,
        workspaceID: endpointAttributes.workspace_id
      }
    case 'azure_blob_storage':
      return {
        storageAccount: endpointAttributes.storage_account,
        containerName: endpointAttributes.container_name,
        blobToken: endpointAttributes.blob_sas_token
      }
    default:
      return {}
  }
}

export const DataStreamAdapter = {
  transformListDataStream(data) {
    return (
      data?.map((dataStream) => {
        const dataSourceInput = dataStream.inputs.find((input) => input.type === 'raw_logs')
        const dataSetType = dataStream.outputs[0].type

        return {
          id: dataStream.id,
          name: dataStream.name,
          templateName: dataStream.templateName,
          dataSource: mapDataSourceName[dataSourceInput.attributes.data_source],
          endpointType: endpointTypeNameMap[dataSetType] || dataSetType,
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
          dataSet: template?.data_set,
          custom: template?.custom,
          active: template?.active
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
          workloads: getWorkloadIds(payload.domains[1])
        },
        endpoint: parseByEndpointType(payload)
      }
    } else {
      parsedPayload = {
        name: payload.name,
        inputs: [
          {
            type: 'raw_logs',
            attributes: {
              data_source: payload.dataSource
            }
          }
        ],
        outputs: [parseByEndpointType(payload)],
        transform: [
          {
            type: 'render_template',
            attributes: {
              template: payload.template
            }
          }
        ],
        active: payload.status
      }

      if (allDomains) {
        parsedPayload.transform.push({
          type: 'filter_workloads',
          attributes: {
            workloads: getWorkloadIds(payload.domains[0])
          }
        })
      }

      if (!allDomains) {
        parsedPayload.transform.push({
          type: 'sampling',
          attributes: {
            rate: 100
          }
        })
      }
    }

    if (payload.hasSampling) {
      parsedPayload.filters.sampling_rate = payload.samplingPercentage
    }

    return parsedPayload
  },
  transformLoadDataStream(datas) {
    const [payload, workloads] = datas

    const dataSourceInput = payload.inputs.find((input) => input.type === 'raw_logs')
    const samplingTransform = payload.transform?.find((item) => item.type === 'sampling')
    const templateId = payload.transform?.find((item) => item.type === 'render_template')
    const endpointOutput = payload.outputs[0]

    return {
      id: payload.id,
      name: payload.name,
      template: templateId?.attributes?.template ?? 'CUSTOM_TEMPLATE',
      dataSet: payload?.data_set,
      dataSource: dataSourceInput?.attributes?.data_source,
      domains: workloads,
      domainOption: samplingTransform ? '1' : '0',
      status: payload.active,
      endpoint: endpointOutput.type,
      hasSampling: !!samplingTransform,
      samplingPercentage: samplingTransform?.attributes?.rate,
      ...getInfoByEndpoint(endpointOutput)
    }
  },
  transformPayloadTemplate(payload) {
    return {
      name: payload.name,
      data_set: JSON.stringify(JSON.parse(payload.dataSet), null, '\t')
    }
  },
  transformLoadTemplate(payload) {
    return {
      id: payload.id,
      name: payload.name,
      dataSet: payload?.data_set
    }
  }
}
