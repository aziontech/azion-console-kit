import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@services/axios/errors'
import { loadDigitalCertificateService } from '@/services/digital-certificates-services/v4/'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  certificateMock: {
    id: 72395,
    name: 'Cert_A.pem',
    certificate:
      '-----BEGIN CERTIFICATE-----\nMIIFazCCA1OgAwIBAgIUJawdmUAWN1sII1Jpe3Em5b9a7GowDQYJKoZIhvcNAQEL\nBQAwRTELMAkGA1UEBhMCQVUxEzARBgNVBAgMClNvbWUtU3RhdGUxITAfBgNVBAoM\nGEludGVybmV0IFdpZGdpdHMgUHR5IEx0ZDAeFw0yNDA0MTcxMjU5MzlaFw0yNTA0\nMTcxMjU5MzlaMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEw\nHwYDVQQKDBhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQwggIiMA0GCSqGSIb3DQEB\nAQUAA4ICDwAwggIKAoICAQCvfATcbfsz8WwH6MCri/DoLpfcGZ8E7rEsQvLtKTT7\n38qwkJbu1PI8jaMJCIG1gi45tKLW4FNI/9ipcCfb1bLUryd+tIUyvjNVHJXW/9MI\np9SYATAma3fVmvdLj1LpVeduLUp3EN8wGC/DpCGalw06d0P0UT3MHvKvHQO2udg3\nyv3+x7QaTsoDF96ynffM1/Mjfqmx/EyHfumzXFYXPP3kc5M+ONM4hxLzHaw5zvJf\niE+z5w9JJkL4YY8MWJcilMMY6RHYwbHn6EAFgKvjblV7meLygWRFJchZQl2WmoRu\nNfds4oxha9gYnoNRmfsHhbvN/6iO5opuLs1rrchcjqbaM/UpXBVVxZUmc9/Hki0q\niVTvazU1hjAt2mddrTOCGFwXh3kS6LMaDDpDN2IIQZyC7SnfeqkmtjAKr3+2dcu8\nqVOx3/bbXxeuRmpn0thazIU5a60EbG1lKmhSkVXrNDoMQhZpmIsks0gXhRVJh8PL\njNiFRFHbSQlu0mcEeYEK+jAnZOt2+edKmIE85WG7Qj51Tg3COiFNz3KIb2JhAC2l\nAAkuGMqRd1pv6OlkPp6rRG6s2qkS4fa0rqiOsnKovjRH8IZT6eYd74GEugMeqKzl\nGEx9GcN9YuPY/oiLdqqTkr0zkiaMHSAaHQzzhf9FE8sNMyK26erC/jX3vlg7vnYZ\nvwIDAQABo1MwUTAdBgNVHQ4EFgQU1zgmI0MhPLNw7DLoB5Njh5f3RAgwHwYDVR0j\nBBgwFoAU1zgmI0MhPLNw7DLoB5Njh5f3RAgwDwYDVR0TAQH/BAUwAwEB/zANBgkq\nhkiG9w0BAQsFAAOCAgEAOogZtUHAX7J0czEGEfdbV+LqOZoZGbhnd5PkTjwFqjy5\n84Gn32acwiu6g0hTGAhdjf0G0rUXVRexleZ/XvDauBMD9zzUs+zcP8zy6JziZdgk\np+ghvsOud4me0g7+f6hmIG79fs76NvUZN3E0jJqjvb7OTZ6B5jg7W2Jr/OAEYexk\nlX6AxQ9J9anHMqT3G1Sy9e8StNbkI0GDA37yvoOH+T0+9FAEP2jn4jFZh/omWH+D\n9Y6t4oQEile4YtNvJSP61Ek21GSr+4Nkw3FN82/HsIIo7VrFKljZgMFS6IRW7eqx\n+kMFYyE5q4ja+KEg8LD60ZdRUaIM7gkEA5aZ9pdOwel6o18MvjaZEWJ8KE0bW+mw\ntYpfeu/11b2+LlCbm4fviH9cDcN+6Rc//nVJjfxH7hwRj7k02jb8FtowVMQTZmYS\nMX5aYMFMTXbtZ/a+6jjRsm0OlsliR/OlgZhhv5CvPUBenwk1I6WMi4bO85jXMcwB\n1v/+AjiGwWwuNylg2WDR4YywmuRSzT8CV8hWIvv6u4OA9jUYV1Es4jDPe1sB1WUC\n3FZpH5ZKR8QYPemK7lQ8Pei+Rf9ABFLFUom2r/OtG7V/4Lo3gh0DjMUIHl72eD37\nr6+FGF5jfz7KwQ5fB13qt0LjwJBYCgfdDRexT+n2ZtikIQzxtnHkzV2iR1rHDm8=\n-----END CERTIFICATE-----',
    type: 'trusted_ca_certificate',
    managed: false,
    csr: null
  }
}

const makeSut = () => {
  const sut = loadDigitalCertificateService

  return {
    sut
  }
}

describe('DigitalCertificatesServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: fixtures.certificateMock }
    })

    const { sut } = makeSut()
    const version = 'v4'
    await sut({ id: fixtures.certificateMock.id })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/digital_certificates/certificates/${fixtures.certificateMock.id}?fields=id,name,type,csr,managed,certificate`,
      method: 'GET'
    })
  })

  it('should parse correctly the api response', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: fixtures.certificateMock }
    })
    const { sut } = makeSut()

    const result = await sut({ id: fixtures.certificateMock.id })

    expect(result).toEqual({
      id: fixtures.certificateMock.id,
      name: fixtures.certificateMock.name,
      type: fixtures.certificateMock.type,
      managed: fixtures.certificateMock.managed,
      csr: undefined,
      certificate: fixtures.certificateMock.certificate
    })
  })

  it.each([
    {
      statusCode: 400,
      expectedError: new Errors.InvalidApiRequestError().message
    },
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
    'should throw when request fails with statusCode $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode,
        body: { data: fixtures.certificateMock }
      })
      const { sut } = makeSut()

      const response = sut({ id: fixtures.certificateMock.id })

      expect(response).rejects.toBe(expectedError)
    }
  )
})
