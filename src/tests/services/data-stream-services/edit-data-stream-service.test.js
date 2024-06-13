import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { editDataStreamService } from '@/services/data-stream-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  dataStreamMockWithSampling: {
    id: 3563,
    name: 'Data Stream Name',
    template: 4,
    dataSource: 'http',
    domains: [[], []],
    status: true,
    hasSampling: true,
    samplingPercentage: 100,
    endpoint: 'qradar',
    QRadarUrl: 'https://qradar-trial-abcdef.qradar.ibmcloud.com:123456'
  },
  dataStreamMock: {
    id: 3563,
    name: 'Data Stream Name',
    template: 4,
    dataSource: 'http',
    domains: [[], []],
    status: true,
    hasSampling: false,
    endpoint: 'qradar',
    QRadarUrl: 'https://qradar-trial-abcdef.qradar.ibmcloud.com:123456'
  },
  dataStreamCustomTemplateMock: {
    id: 3563,
    name: 'Data Stream Custom a Template',
    template: 'CUSTOM_TEMPLATE',
    dataSet: '{"session_id":"$session_id"}',
    dataSource: 'http',
    domains: [[], []],
    endpoint: 'qradar',
    QRadarUrl: 'https://qradar-trial-abcdef.qradar.ibmcloud.com:123456'
  }
}

const makeSut = () => {
  const sut = editDataStreamService

  return {
    sut
  }
}

describe('DataStreamServices', () => {
  it('should updated call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()
    const version = 'v3'
    await sut(fixtures.dataStreamMockWithSampling)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/data_streaming/streamings/${fixtures.dataStreamMockWithSampling.id}`,
      method: 'PUT',
      body: {
        name: fixtures.dataStreamMockWithSampling.name,
        template_id: fixtures.dataStreamMockWithSampling.template,
        data_source: fixtures.dataStreamMockWithSampling.dataSource,
        domain_ids: [],
        active: fixtures.dataStreamMockWithSampling.status,
        all_domains: true,
        sampling_percentage: fixtures.dataStreamMockWithSampling.samplingPercentage,
        endpoint: {
          endpoint_type: fixtures.dataStreamMockWithSampling.endpoint,
          url: fixtures.dataStreamMockWithSampling.QRadarUrl
        }
      }
    })
  })

  it('should updated call API with correct params custom a template', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()
    const version = 'v3'
    await sut(fixtures.dataStreamCustomTemplateMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/data_streaming/streamings/${fixtures.dataStreamCustomTemplateMock.id}`,
      method: 'PUT',
      body: {
        name: fixtures.dataStreamCustomTemplateMock.name,
        template_model: fixtures.dataStreamCustomTemplateMock.dataSet,
        domain_ids: [],
        all_domains: true,
        endpoint: {
          endpoint_type: fixtures.dataStreamCustomTemplateMock.endpoint,
          url: fixtures.dataStreamCustomTemplateMock.QRadarUrl
        }
      }
    })
  })

  it('should use the provided text on invalid headers of standard endpoint type ', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    const dataStreamMock = {
      ...fixtures.dataStreamMock,
      endpoint: 'standard',
      payloadFormat: 'format-payload',
      lineSeparator: 'separator-test',
      maxSize: '123321',
      headers: [{ value: 'PORT:1010' }, { value: 'invalid-header' }]
    }
    const version = 'v3'
    await sut(dataStreamMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/data_streaming/streamings/${fixtures.dataStreamMock.id}`,
      method: 'PUT',
      body: {
        name: fixtures.dataStreamMock.name,
        template_id: fixtures.dataStreamMock.template,
        data_source: fixtures.dataStreamMock.dataSource,
        domain_ids: [],
        all_domains: true,
        active: fixtures.dataStreamMock.status,
        endpoint: {
          endpoint_type: 'standard',
          url: fixtures.dataStreamMock.endpointUrl,
          payload_format: 'format-payload',
          log_line_separator: 'separator-test',
          max_size: '123321',
          headers: {
            PORT: '1010',
            'invalid-header': 'invalid-header'
          }
        }
      }
    })
  })

  it('should return a feedback message on successfully updated', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()
    const feedbackMessage = await sut(fixtures.dataStreamMock)

    expect(feedbackMessage).toBe('Your data stream has been updated')
  })

  it('should return a feedback message on successfully updated with domains', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()
    const dataStreamMockWithDomains = {
      ...fixtures.dataStreamMock,
      domains: [[], [{ domainID: 1 }, { domainID: 2 }]]
    }

    const feedbackMessage = await sut(dataStreamMockWithDomains)

    expect(feedbackMessage).toBe('Your data stream has been updated')
  })

  it('should return a feedback message on successfully updated', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()
    const feedbackMessage = await sut(fixtures.dataStreamMock)

    expect(feedbackMessage).toBe('Your data stream has been updated')
  })

  it('should throw an error on a invalid Data Stream endpoint is used', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    const dataStreamMock = {
      ...fixtures.dataStreamMock,
      endpoint: 'invalid-enpoint-type'
    }

    const result = sut(dataStreamMock)

    expect(result).rejects.toBe('Invalid Data Stream Endpoint Type')
  })

  it.each([
    {
      endpoint: 'standard',
      values: {
        endpointUrl: 'https://app.domain.com/',
        payloadFormat: '$dataset',
        lineSeparator: '\n',
        maxSize: '10000000',
        headers: [{ value: 'name: api' }, { value: 'teste: 1' }]
      }
    },
    {
      endpoint: 'kafka',
      values: {
        kafkaTopic: 'example_topic',
        bootstrap_servers: 'kafka-server.com:9092,kafka-server-2.com:9092',
        useTls: true,
      }
    },
    {
      endpoint: 's3',
      values: {
        accessKey: 'MYACCESSKEY',
        region: 'us-east-1',
        objectKey: 'my_prefix',
        bucket: 'bucket_example',
        contentType: 'plain/text',
        host: 'http://aws-host.com',
        secretKey: 'MYSECRETKEY'
      }
    },
    {
      endpoint: 'big_query',
      values: {
        datasetID: 'my_dataset',
        projectID: 'my_project',
        tableID: 'my_table',
        serviceAccountKey: 'service_account_key'
      }
    },
    {
      endpoint: 'elasticsearch',
      values: {
        elasticsearchUrl: 'http://elasticsearch.com',
        apiKey: 'XYZ_API_KEY'
      }
    },
    {
      endpoint: 'splunk',
      values: {
        splunkUrl: 'https://inputs.splunk-client.splunkcloud.com:1337/services/collector',
        splunkApiKey: 'MYAPIKEY'
      }
    },
    {
      endpoint: 'aws_kinesis_firehose',
      values: {
        awsAccessKey: 'MYACCESSKEY',
        streamName: 'my_stream_name',
        awsRegion: 'us-east-1',
        awsSecretKey: 'MYSECRETKEY'
      }
    },
    {
      endpoint: 'datadog',
      values: {
        datadogUrl: 'https://http-intake.logs.datadoghq.com/v1/input',
        datadogApiKey: 'MYAPIKEY'
      }
    },
    {
      endpoint: 'qradar',
      values: {
        QRadarUrl: 'https://qradar-trial-abcdef.qradar.ibmcloud.com:123456'
      }
    },
    {
      endpoint: 'azure_monitor',
      values: {
        logType: 'myLogType',
        sharedKey: 'mysharedkey',
        generatedField: 'timeGeneratedField',
        workspaceID: 'anfhw-123sd-466gcs'
      }
    },
    {
      endpoint: 'azure_blob_storage',
      values: {
        storageAccount: 'mystorageaccount',
        containerName: 'log_container',
        blobToken: 'fd56e23e1f12efe'
      }
    }
  ])('should be able to edit using endpoint type: $endpoint', async ({ endpoint, values }) => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    const dataStreamEndpointMock = {
      ...fixtures.dataStreamMock,
      endpoint,
      ...values
    }

    const feedbackMessage = await sut(dataStreamEndpointMock)

    expect(feedbackMessage).toBe('Your data stream has been updated')
  })

  it.each([
    {
      scenario: 'used url invalid',
      apiErrorMock: 'URL is not on correct format.',
      errorKey: 'invalid_url'
    },
    {
      scenario: 'user does not have sampling client flag',
      apiErrorMock: 'You do not have permission to use Data Stream sampling',
      errorKey: 'user_has_no_flag'
    },
    {
      scenario: 'used max size invalid',
      apiErrorMock: 'Max size must be an integer between 1000000 bytes and 2147483647 bytes',
      errorKey: 'max_size_out_of_range'
    },
    {
      scenario: 'used dataset invalid',
      apiErrorMock: `Payload Format doesn't contains $dataset variable.`,
      errorKey: 'payload_format_without_dataset'
    },
    {
      scenario: 'used bootstrap serves invalids',
      apiErrorMock: 'Invalid bootstrap servers',
      errorKey: 'invalid_bootstrap_servers'
    },
    {
      scenario: 'used host url invalid',
      apiErrorMock: 'Host URL is not on correct format.',
      errorKey: 'invalid_host_url'
    },
    {
      scenario: 'used service account key invalid',
      apiErrorMock: 'Service Account Key value must be a valid JSON',
      errorKey: 'invalid_service_account_key'
    },
    {
      scenario: 'used datadog url invalid',
      apiErrorMock: 'Datadog URL is not on correct format.',
      errorKey: 'invalid_datadog_url'
    }
  ])('Should return an API updated error for an $scenario', async ({ errorKey, apiErrorMock }) => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        [errorKey]: [apiErrorMock]
      }
    })
    const { sut } = makeSut()

    const feedbackMessage = sut(fixtures.dataStreamMock)

    expect(feedbackMessage).rejects.toThrow(apiErrorMock)
  })

  it.each([
    {
      statusCode: 401,
      expectedError: new Errors.InvalidApiTokenError().message
    },
    {
      statusCode: 403,
      expectedError: new Errors.PermissionError().message
    },
    {
      statusCode: 404,
      expectedError: new Errors.NotFoundError().message
    },
    {
      statusCode: 500,
      expectedError: new Errors.InternalServerError().message
    },
    {
      statusCode: 'unmappedStatusCode',
      expectedError: new Errors.UnexpectedError().message
    }
  ])(
    'should throw when request fails with status code $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode
      })
      const { sut } = makeSut()

      const response = sut(fixtures.dataStreamMock)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
