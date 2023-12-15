import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { editDataStreamingService } from '@/services/data-streaming-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  dataStreamingMockWithSampling: {
    id: 3563,
    name: 'Data Streaming Name',
    template: 4,
    dataSource: 'http',
    domains: [[], []],
    status: true,
    hasSampling: true,
    samplingPercentage: 100,
    endpoint: 'qradar',
    QRadarUrl: 'https://qradar-trial-abcdef.qradar.ibmcloud.com:123456'
  },
  dataStreamingMock: {
    id: 3563,
    name: 'Data Streaming Name',
    template: 4,
    dataSource: 'http',
    domains: [[], []],
    status: true,
    hasSampling: false,
    endpoint: 'qradar',
    QRadarUrl: 'https://qradar-trial-abcdef.qradar.ibmcloud.com:123456'
  }
}

const makeSut = () => {
  const sut = editDataStreamingService

  return {
    sut
  }
}

describe('DataStreamingServices', () => {
  it('should updated call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()
    const version = 'v3'
    await sut(fixtures.dataStreamingMockWithSampling)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/data_streaming/streamings/${fixtures.dataStreamingMockWithSampling.id}`,
      method: 'PUT',
      body: {
        name: fixtures.dataStreamingMockWithSampling.name,
        template_id: fixtures.dataStreamingMockWithSampling.template,
        data_source: fixtures.dataStreamingMockWithSampling.dataSource,
        domain_ids: [],
        active: fixtures.dataStreamingMockWithSampling.status,
        all_domains: true,
        sampling_percentage: fixtures.dataStreamingMockWithSampling.samplingPercentage,
        endpoint: {
          endpoint_type: fixtures.dataStreamingMockWithSampling.endpoint,
          url: fixtures.dataStreamingMockWithSampling.QRadarUrl
        }
      }
    })
  })

  it('should use the provided text on invalid headers of standard endpoint type ', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    const dataStreamingMock = {
      ...fixtures.dataStreamingMock,
      endpoint: 'standard',
      payloadFormat: 'format-payload',
      lineSeparator: 'separator-test',
      maxSize: '123321',
      headers: [{ value: 'PORT:1010' }, { value: 'invalid-header' }]
    }
    const version = 'v3'
    await sut(dataStreamingMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/data_streaming/streamings/${fixtures.dataStreamingMock.id}`,
      method: 'PUT',
      body: {
        name: fixtures.dataStreamingMock.name,
        template_id: fixtures.dataStreamingMock.template,
        data_source: fixtures.dataStreamingMock.dataSource,
        domain_ids: [],
        all_domains: true,
        active: fixtures.dataStreamingMock.status,
        endpoint: {
          endpoint_type: 'standard',
          url: fixtures.dataStreamingMock.endpointUrl,
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
    const feedbackMessage = await sut(fixtures.dataStreamingMock)

    expect(feedbackMessage).toBe('Your data streaming has been updated')
  })

  it('should return a feedback message on successfully updated with domains', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()
    const dataStreamingMockWithDomains = {
      ...fixtures.dataStreamingMock,
      domains: [[], [{ domainID: 1 }, { domainID: 2 }]]
    }

    const feedbackMessage = await sut(dataStreamingMockWithDomains)

    expect(feedbackMessage).toBe('Your data streaming has been updated')
  })

  it('should return a feedback message on successfully updated', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()
    const feedbackMessage = await sut(fixtures.dataStreamingMock)

    expect(feedbackMessage).toBe('Your data streaming has been updated')
  })

  it('should throw an error on a invalid Data Streaming endpoint is used', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    const dataStreamingMock = {
      ...fixtures.dataStreamingMock,
      endpoint: 'invalid-enpoint-type'
    }

    const result = sut(dataStreamingMock)

    expect(result).rejects.toBe('Invalid Data Streaming Endpoint Type')
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
        bootstrap_servers: 'kafka-server.com:9092,kafka-server-2.com:9092'
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

    const dataStreamingEndpointMock = {
      ...fixtures.dataStreamingMock,
      endpoint,
      ...values
    }

    const feedbackMessage = await sut(dataStreamingEndpointMock)

    expect(feedbackMessage).toBe('Your data streaming has been updated')
  })

  it.each([
    {
      scenario: 'used url invalid',
      apiErrorMock: 'URL is not on correct format.',
      errorKey: 'invalid_url'
    },
    {
      scenario: 'user does not have sampling client flag',
      apiErrorMock: 'You do not have permission to use Data Streaming sampling',
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

    const feedbackMessage = sut(fixtures.dataStreamingMock)

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

      const response = sut(fixtures.dataStreamingMock)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
