import { documentationGuideProducts } from '@/helpers/azion-documentation-catalog'
import { afterAll, describe, expect, it, vi } from 'vitest'

vi.stubGlobal('window', {
  open: (url) => url
})

const makeSut = () => {
  const sut = documentationGuideProducts

  return {
    sut
  }
}

describe('AzionDocumentation', () => {
  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('should open edge application guide with correct link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut.edgeApplication()

    expect(openWindowSpy).toHaveBeenCalledWith(
      'https://www.azion.com/en/documentation/products/guides/build/build-an-application/',
      '_blank'
    )
  })

  it('should open real time metrics guide with correct link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut.realTimeMetrics()

    expect(openWindowSpy).toHaveBeenCalledWith(
      'https://www.azion.com/en/documentation/products/guides/use-real-time-metrics/',
      '_blank'
    )
  })

  it('should open real time events http request guide with correct link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut.realTimeEventsHttpRequest()

    expect(openWindowSpy).toHaveBeenCalledWith(
      'https://www.azion.com/en/documentation/products/real-time-events/#http-requests',
      '_blank'
    )
  })

  it('should open real time events edge functions guide with correct link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut.realTimeEventsEdgeFunctions()

    expect(openWindowSpy).toHaveBeenCalledWith(
      'https://www.azion.com/en/documentation/products/real-time-events/#edge-functions',
      '_blank'
    )
  })

  it('should open real time events edge functions console guide with correct link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut.realTimeEventsEdgeFunctionsConsole()

    expect(openWindowSpy).toHaveBeenCalledWith(
      'https://www.azion.com/en/documentation/products/real-time-events/#edge-functions-console',
      '_blank'
    )
  })

  it('should open real time events image processor guide with correct link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut.realTimeEventsImageProcessor()

    expect(openWindowSpy).toHaveBeenCalledWith(
      'https://www.azion.com/en/documentation/products/real-time-events/#image-processor',
      '_blank'
    )
  })

  it('should open real time events tiered cache guide with correct link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut.realTimeEventsTieredCache()

    expect(openWindowSpy).toHaveBeenCalledWith(
      'https://www.azion.com/en/documentation/products/real-time-events/#tiered-cache',
      '_blank'
    )
  })

  it('should open real time events edge DNS guide with correct link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut.realTimeEventsEdgeDNS()

    expect(openWindowSpy).toHaveBeenCalledWith(
      'https://www.azion.com/en/documentation/products/real-time-events/#edge-dns',
      '_blank'
    )
  })

  it('should open real time events data stream guide with correct link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut.realTimeEventsDataStream()

    expect(openWindowSpy).toHaveBeenCalledWith(
      'https://www.azion.com/en/documentation/products/real-time-events/#data-streaming',
      '_blank'
    )
  })

  it('should open real time events activity history guide with correct link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut.realTimeEventsActivityHistory()

    expect(openWindowSpy).toHaveBeenCalledWith(
      'https://www.azion.com/en/documentation/products/real-time-events/#activity-history',
      '_blank'
    )
  })

  it('should open edge services resources guide with correct link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut.edgeServicesResources()

    expect(openWindowSpy).toHaveBeenCalledWith(
      'https://www.azion.com/en/documentation/products/edge-orchestrator/edge-services/#resources',
      '_blank'
    )
  })

  it('should open edge DNS record types guide with correct link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut.edgeDnsRecordTypes()

    expect(openWindowSpy).toHaveBeenCalledWith(
      'https://www.azion.com/en/documentation/products/secure/edge-dns/#type',
      '_blank'
    )
  })
})
