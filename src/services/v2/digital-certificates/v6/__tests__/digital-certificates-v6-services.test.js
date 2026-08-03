import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DigitalCertificatesV6Service } from '@/services/v2/digital-certificates/v6/digital-certificates-v6-service'
import { DigitalCertificatesCRLV6Service } from '@/services/v2/digital-certificates/v6/digital-certificates-crl-v6-service'

const ACCEPT = { accept: 'application/json; version=4' }
const ID = 'cert-42'
const VERSION_ID = 'ver-9'

const scenarios = [
  {
    label: 'DigitalCertificatesV6Service',
    createService: () => new DigitalCertificatesV6Service(),
    baseURL: '/tls-api/digital_certificates/api/certificates',
    rootKey: ['digital-certificates-v6'],
    createPayload: { digitalCertificateName: 'cert', certificateType: 'edge_certificate' },
    editValues: { name: 'cert', type: 'edge_certificate' }
  },
  {
    label: 'DigitalCertificatesCRLV6Service',
    createService: () => new DigitalCertificatesCRLV6Service(),
    baseURL: '/tls-api/digital_certificates/api/crls',
    rootKey: ['digital-certificates-crl-v6'],
    createPayload: { digitalCertificateName: 'crl', certificate: 'PEM' },
    editValues: { name: 'crl' }
  }
]

const buildService = (scenario) => {
  const service = scenario.createService()
  service.http = { request: vi.fn().mockResolvedValue({ data: {} }) }
  service.useEnsureQueryData = vi.fn((_queryKey, queryFn) => queryFn())
  service.queryClient = { removeQueries: vi.fn() }
  return service
}

const buildInvocations = (scenario) => ({
  list: (service) => service.list({ page: 1 }),
  load: (service) => service.load({ id: ID }),
  create: (service) => service.create(scenario.createPayload),
  edit: (service) => service.edit({ id: ID, values: scenario.editValues }),
  delete: (service) => service.delete(ID),
  listVersions: (service) => service.listVersions({ id: ID, page: 1 }),
  revert: (service) => service.revert({ id: ID, versionId: VERSION_ID })
})

describe.each(scenarios)('$label', (scenario) => {
  const invocations = buildInvocations(scenario)
  const publicMethods = Object.keys(invocations)

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Property P7 - every method sends Accept: application/json; version=4', () => {
    it.each(publicMethods)(
      '%s sends the versioned Accept config on every request',
      async (name) => {
        const service = buildService(scenario)

        await invocations[name](service)

        const { calls } = service.http.request.mock
        expect(calls.length).toBeGreaterThan(0)
        calls.forEach(([config]) => {
          expect(config.config).toEqual(ACCEPT)
        })
      }
    )
  })

  describe('HTTP method and URL per operation', () => {
    let service

    beforeEach(() => {
      service = buildService(scenario)
    })

    it('list issues GET on the baseURL', async () => {
      await service.list({ page: 1 })

      expect(service.http.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: scenario.baseURL,
          params: { page: 1 },
          config: ACCEPT
        })
      )
    })

    it('load issues GET on /{id}', async () => {
      await service.load({ id: ID })

      expect(service.http.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: `${scenario.baseURL}/${ID}`,
          config: ACCEPT
        })
      )
    })

    it('create issues POST on the baseURL', async () => {
      await service.create(scenario.createPayload)

      expect(service.http.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: scenario.baseURL,
          config: ACCEPT
        })
      )
    })

    it('edit issues PUT on /{id}', async () => {
      await service.edit({ id: ID, values: scenario.editValues })

      expect(service.http.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'PUT',
          url: `${scenario.baseURL}/${ID}`,
          config: ACCEPT
        })
      )
    })

    it('delete issues DELETE on /{id}', async () => {
      await service.delete(ID)

      expect(service.http.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'DELETE',
          url: `${scenario.baseURL}/${ID}`,
          config: ACCEPT
        })
      )
    })

    it('listVersions issues GET on /{id}/versions', async () => {
      await service.listVersions({ id: ID, page: 1 })

      expect(service.http.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: `${scenario.baseURL}/${ID}/versions`,
          params: { page: 1 },
          config: ACCEPT
        })
      )
    })

    it('revert issues POST on /{id}/versions/{versionId}/revert with an empty body', async () => {
      await service.revert({ id: ID, versionId: VERSION_ID })

      expect(service.http.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: `${scenario.baseURL}/${ID}/versions/${VERSION_ID}/revert`,
          body: {},
          config: ACCEPT
        })
      )
    })
  })

  describe('mutations invalidate the resource root query key', () => {
    let service

    beforeEach(() => {
      service = buildService(scenario)
    })

    it('create calls removeQueries with the root key', async () => {
      await service.create(scenario.createPayload)

      expect(service.queryClient.removeQueries).toHaveBeenCalledWith({ queryKey: scenario.rootKey })
    })

    it('edit calls removeQueries with the root key', async () => {
      await service.edit({ id: ID, values: scenario.editValues })

      expect(service.queryClient.removeQueries).toHaveBeenCalledWith({ queryKey: scenario.rootKey })
    })

    it('delete calls removeQueries with the root key', async () => {
      await service.delete(ID)

      expect(service.queryClient.removeQueries).toHaveBeenCalledWith({ queryKey: scenario.rootKey })
    })

    it('revert calls removeQueries with the root key', async () => {
      await service.revert({ id: ID, versionId: VERSION_ID })

      expect(service.queryClient.removeQueries).toHaveBeenCalledWith({ queryKey: scenario.rootKey })
    })
  })
})
