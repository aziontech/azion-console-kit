import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { createRecordsService } from '@/services/intelligent-dns-records-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  dnsRecordMock: {
    intelligentDNSID: 123987902,
    selectedRecordType: { _value: 'dns-record-value' },
    name: 'Az-dns-name',
    value: 'dns-answer-record-value',
    ttl: '8000',
    description: 'dns record description',
    selectedPolicy: { _value: 'weighted' },
    weight: 0.9
  }
}

const makeSut = () => {
  const sut = createRecordsService

  return {
    sut
  }
}

describe('IntelligentDnsRecordsServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: {
        results: {
          id: 1
        }
      }
    })
    const { sut } = makeSut()

    await sut(fixtures.dnsRecordMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `intelligent_dns/${fixtures.dnsRecordMock.intelligentDNSID}/records`,
      method: 'POST',
      body: {
        record_type: fixtures.dnsRecordMock.selectedRecordType,
        entry: fixtures.dnsRecordMock.name,
        answers_list: [fixtures.dnsRecordMock.value],
        ttl: fixtures.dnsRecordMock.ttl,
        description: fixtures.dnsRecordMock.description,
        policy: fixtures.dnsRecordMock.selectedPolicy,
        weight: fixtures.dnsRecordMock.weight
      }
    })
  })

  it('should return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: {
        results: {
          id: 1
        }
      }
    })
    const { sut } = makeSut()

    const data = await sut(fixtures.dnsRecordMock)

    expect(data.feedback).toBe('Intelligent DNS Record has been created')
  })

  it('Should return an API error when API detect an invalid configuration to Intelligent DNS Record', async () => {
    const apiErrorMock = 'This is an API validation error message returned'
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        errors: [apiErrorMock]
      }
    })
    const { sut } = makeSut()

    const feedbackMessage = sut(fixtures.dnsRecordMock)

    expect(feedbackMessage).rejects.toBe(apiErrorMock)
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

      const response = sut(fixtures.dnsRecordMock)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
