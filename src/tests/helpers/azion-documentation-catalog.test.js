import { documentationCatalog } from '@/helpers/azion-documentation-catalog'
import { afterAll, describe, expect, it, vi } from 'vitest'

vi.stubGlobal('window', {
  open: (url) => url
})

const makeSut = () => {
  const sut = documentationCatalog

  return {
    sut
  }
}

describe('AzionDocumentationCatalog', () => {
  afterAll(() => {
    vi.unstubAllGlobals()
  })
  it('should open variables documentation with correct link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut.variables()

    expect(openWindowSpy).toHaveBeenCalledWith(
      `https://www.azion.com/en/search-result/?q=variables&filter=doc`
    )
  })
  it('should open resources documentation with correct link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut.resources()

    expect(openWindowSpy).toHaveBeenCalledWith(
      `https://www.azion.com/en/search-result/?q=&filter=doc`
    )
  })
  it('should open edge service documentation with correct link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut.edgeServices()

    expect(openWindowSpy).toHaveBeenCalledWith(
      `https://www.azion.com/en/search-result/?q=edge services&filter=doc`
    )
  })
  it('should open edge DNS documentation with correct link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut.edgeDNS()

    expect(openWindowSpy).toHaveBeenCalledWith(
      `https://www.azion.com/en/search-result/?q=edge-dns&filter=doc`
    )
  })
  it('should open personal tokens documentation with correct link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut.personalTokens()

    expect(openWindowSpy).toHaveBeenCalledWith(
      `https://www.azion.com/en/search-result/?q=personal tokens&filter=doc`
    )
  })
  it('should open domains documentation with correct link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut.domains()

    expect(openWindowSpy).toHaveBeenCalledWith(
      `https://www.azion.com/en/search-result/?q=domains&filter=doc`
    )
  })
  it('should open get started documentation with correct link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut.getStarted()

    expect(openWindowSpy).toHaveBeenCalledWith(
      `https://www.azion.com/en/search-result/?q=get started&filter=doc`
    )
  })
  it('should open real-time purge documentation with correct link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut.realTimePurge()

    expect(openWindowSpy).toHaveBeenCalledWith(
      `https://www.azion.com/en/search-result/?q=real-time-purge&filter=doc`
    )
  })
  it('should open network lists documentation with correct link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut.networkLists()

    expect(openWindowSpy).toHaveBeenCalledWith(
      `https://www.azion.com/en/search-result/?q=network lists&filter=doc`
    )
  })
  it('should open digital certificates documentation with correct link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut.digitalCertificates()

    expect(openWindowSpy).toHaveBeenCalledWith(
      `https://www.azion.com/en/search-result/?q=digital certificates&filter=doc`
    )
  })
  it('should open team permissions documentation with correct link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut.teamPermissions()

    expect(openWindowSpy).toHaveBeenCalledWith(
      `https://www.azion.com/en/search-result/?q=team permissions&filter=doc`
    )
  })

  it('should open data stream documentation with correct link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut.dataStream()

    expect(openWindowSpy).toHaveBeenCalledWith(
      `https://www.azion.com/en/search-result/?q=data streaming&filter=doc`
    )
  })

  it('should open edge functions documentation with correct link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut.edgeFunctions()

    expect(openWindowSpy).toHaveBeenCalledWith(
      `https://www.azion.com/en/search-result/?q=edge functions&filter=doc`
    )
  })

  it('should open edge firewall documentation with correct link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut.edgeFirewall()

    expect(openWindowSpy).toHaveBeenCalledWith(
      `https://www.azion.com/en/search-result/?q=edge firewall&filter=doc`
    )
  })

  it('should open edge application documentation with correct link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut.edgeApplication()

    expect(openWindowSpy).toHaveBeenCalledWith(
      `https://www.azion.com/en/search-result/?q=edge application&filter=doc`
    )
  })

  it('should open users documentation with correct link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut.users()

    expect(openWindowSpy).toHaveBeenCalledWith(
      `https://www.azion.com/en/search-result/?q=users&filter=doc`
    )
  })

  it('should open activity history documentation with correct link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut.activityHistory()

    expect(openWindowSpy).toHaveBeenCalledWith(
      `https://www.azion.com/en/search-result/?q=activity history&filter=doc`
    )
  })
  it('should open edge nodes documentation with correct link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut.edgeNodes()

    expect(openWindowSpy).toHaveBeenCalledWith(
      `https://www.azion.com/en/search-result/?q=edge nodes&filter=doc`
    )
  })
  it('should open records documentation with correct link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut.records()

    expect(openWindowSpy).toHaveBeenCalledWith(
      `https://www.azion.com/en/search-result/?q=records&filter=doc`
    )
  })
  it('should edge application cache settings documentation with correct link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut.edgeApplicationCacheSettings()

    expect(openWindowSpy).toHaveBeenCalledWith(
      `https://www.azion.com/en/search-result/?q=cache settings&filter=doc`
    )
  })
  it('should edge firewall rules engine documentation with correct link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut.edgeFirewallRulesEngine()

    expect(openWindowSpy).toHaveBeenCalledWith(
      `https://www.azion.com/en/search-result/?q=edge firewall rules engine&filter=doc`
    )
  })
})
