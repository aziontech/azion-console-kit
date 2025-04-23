import { describe, expect, it, vi } from 'vitest'
import { listVulcanPresetsService } from '@/services/vulcan-services/list-vulcan-presets-service'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'

const makeSut = () => {
  const sut = {
    listVulcanPresetsService
  }
  return {
    sut
  }
}

describe('VulcanServices', () => {
  it('should call API with correct params', async () => {
    const { sut } = makeSut()
    const mockPresets = [{ name: 'Next.js' }]

    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      body: mockPresets,
      statusCode: 200
    })

    await sut.listVulcanPresetsService()

    expect(requestSpy).toHaveBeenCalledWith({
      baseURL: '/',
      url: '/v4/utils/project_samples',
      method: 'GET'
    })
  })

  it('should return parsed presets when API returns data', async () => {
    const { sut } = makeSut()
    const mockPresets = [{ name: 'Next.js' }, { name: 'Angular' }, { name: 'Astro' }]

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      body: mockPresets,
      statusCode: 200
    })

    const result = await sut.listVulcanPresetsService()

    expect(result).toEqual([
      { label: 'Next.js', value: 'next.js' },
      { label: 'Angular', value: 'angular' },
      { label: 'Astro', value: 'astro' }
    ])
  })
})
