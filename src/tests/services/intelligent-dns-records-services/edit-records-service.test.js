import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { editRecordsService } from '@/services/intelligent-dns-records-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  dnsRecordMock: {
    intelligentDNSId: 123987902,
    id: 625837692,
    recordType: 'CNAME',
    name: 'Az-dns-name',
    value: 'dns-answer-record-CNAME.com',
    ttl: '8000',
    description: 'dns record description',
    policy: 'weighted',
    weight: 0.9
  }
}

const makeSut = () => {
  const sut = editRecordsService

  return {
    sut
  }
}

describe('IntelligentDnsRecordsServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    await sut(fixtures.dnsRecordMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `intelligent_dns/${fixtures.dnsRecordMock.intelligentDNSId}/records/${fixtures.dnsRecordMock.id}`,
      method: 'PUT',
      body: {
        record_type: fixtures.dnsRecordMock.recordType,
        entry: fixtures.dnsRecordMock.name,
        answers_list: [fixtures.dnsRecordMock.value],
        ttl: fixtures.dnsRecordMock.ttl,
        policy: fixtures.dnsRecordMock.policy,
        weight: fixtures.dnsRecordMock.weight,
        description: fixtures.dnsRecordMock.description
      }
    })
  })

  it('should return a feedback message on successfully edited', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.dnsRecordMock)

    expect(feedbackMessage).toBe('Intelligent DNS Record has been updated')
  })

  it('Should return an API error when API detect an invalid configuration to edit Intelligent DNS Record', async () => {
    const apiErrorMock = 'Some invalid configuration has been found on the backend'
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
