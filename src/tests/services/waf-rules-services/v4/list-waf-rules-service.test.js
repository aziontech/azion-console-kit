import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listWafRulesService } from '@/services/waf-rules-services/v4'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  wafRulesMock: {
    id: 4099,
    active: true,
    name: 'xsxs',
    threats_configuration: {
      cross_site_scripting: true,
      cross_site_scripting_sensitivity: 'medium',
      directory_traversal: true,
      directory_traversal_sensitivity: 'medium',
      evading_tricks: true,
      evading_tricks_sensitivity: 'medium',
      file_upload: true,
      file_upload_sensitivity: 'medium',
      identified_attack: true,
      identified_attack_sensitivity: 'medium',
      remote_file_inclusion: true,
      remote_file_inclusion_sensitivity: 'medium',
      sql_injection: true,
      sql_injection_sensitivity: 'medium',
      unwanted_access: true,
      unwanted_access_sensitivity: 'medium'
    }
  },
  wafRulesMockWithFalseActive: {
    id: 4099,
    active: false,
    name: 'xsxs',
    threats_configuration: {
      cross_site_scripting: true,
      cross_site_scripting_sensitivity: 'medium',
      directory_traversal: true,
      directory_traversal_sensitivity: 'medium',
      evading_tricks: true,
      evading_tricks_sensitivity: 'medium',
      file_upload: true,
      file_upload_sensitivity: 'medium',
      identified_attack: false,
      identified_attack_sensitivity: 'medium',
      remote_file_inclusion: true,
      remote_file_inclusion_sensitivity: 'medium',
      sql_injection: true,
      sql_injection_sensitivity: 'medium',
      unwanted_access: false,
      unwanted_access_sensitivity: 'medium'
    }
  }
}

const makeSut = () => {
  const sut = listWafRulesService

  return {
    sut
  }
}

describe('WafRulesServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      count: 0,
      body: { result: null }
    })

    const { sut } = makeSut()
    await sut({})

    const version = 'v4'

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge_firewall/wafs?ordering=name&page=1&page_size=10&fields=&search=`,
      method: 'GET'
    })
  })

  it('should parsed correctly each waf rules', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      count: 2,
      body: { results: [fixtures.wafRulesMock, fixtures.wafRulesMockWithFalseActive] }
    })
    const { sut } = makeSut()

    const result = await sut({})

    expect(result).toEqual([
      {
        id: fixtures.wafRulesMock.id,
        active: {
          content: 'Active',
          severity: 'success'
        },
        name: fixtures.wafRulesMock.name,
        threatsConfiguration: [
          'File upload',
          'Evading Tricks',
          'Unwanted Access',
          'Identified Attack',
          'Cross-Site Scripting (XSS)',
          'Directory Traversal',
          'Remote File Inclusions (RFI)',
          'SQL Injection'
        ]
      },
      {
        id: fixtures.wafRulesMock.id,
        active: {
          content: 'Inactive',
          severity: 'danger'
        },
        name: fixtures.wafRulesMock.name,
        threatsConfiguration: [
          'File upload',
          'Evading Tricks',
          'Cross-Site Scripting (XSS)',
          'Directory Traversal',
          'Remote File Inclusions (RFI)',
          'SQL Injection'
        ]
      }
    ])
  })
})
