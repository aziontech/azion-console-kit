import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { createRecordsService } from '@/services/edge-dns-records-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  dnsRecordMock: {
    edgeDNSID: 123987902,
    selectedRecordType: 'dns-record-value',
    name: 'Az-dns-name',
    value: 'dns-answer-record-value',
    ttl: '8000',
    description: 'dns record description',
    selectedPolicy: 'weighted',
    weight: 0.9
  },
  anameDnsRecordTypeMock: {
    edgeDNSID: 123987902,
    selectedRecordType: 'aname',
    name: 'Aname-dns-name',
    value: 'aname-record-type',
    ttl: 20,
    description: 'dns aname record description',
    selectedPolicy: 'weighted',
    weight: 0.9
  },
  ttlDefaultValue: 20
}

const makeSut = () => {
  const sut = createRecordsService

  return {
    sut
  }
}

describe('EdgeDnsRecordsServices', () => {
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
    const version = 'v3'
    await sut(fixtures.dnsRecordMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/intelligent_dns/${fixtures.dnsRecordMock.edgeDNSID}/records`,
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
  it('should create a aname record type with default value', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: {
        results: {
          id: 1
        }
      }
    })
    const { sut } = makeSut()
    await sut(fixtures.anameDnsRecordTypeMock)

    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          ttl: fixtures.ttlDefaultValue
        })
      })
    )
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

    expect(data.feedback).toBe('Edge DNS Record has been created')
  })

  it('Should return an API error when API detect an invalid configuration to Edge DNS Record', async () => {
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
