import { AnalyticsTrackerAdapter } from '@/plugins/adapters/AnalyticsTrackerAdapter'
import { describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const analyticsClientSpy = {
    track: vi.fn(),
    identify: vi.fn()
  }

  const sut = new AnalyticsTrackerAdapter(analyticsClientSpy)

  return {
    sut,
    analyticsClientSpy
  }
}

describe('AnalyticsTrackerAdapter', () => {
  it('should call identify when valid identification is provided', () => {
    const { sut, analyticsClientSpy } = makeSut()
    const mockId = 'mock-id-ABC-123'
    sut.identify(mockId)

    expect(analyticsClientSpy.identify).toHaveBeenCalledWith(mockId, {})
  })

  it('should not call identify when no identification is provided', () => {
    const { sut, analyticsClientSpy } = makeSut()
    const mockId = ''
    sut.identify(mockId)

    expect(analyticsClientSpy.identify).not.toHaveBeenCalled()
  })

  it('should be able to store multiple events and track them all', () => {
    const { sut, analyticsClientSpy } = makeSut()
    sut.pageLoad({ url: 'test-url-1' }).pageLoad({ url: 'test-url-2' })
    sut.pageLoad({ url: 'test-url-3' })

    sut.track()

    expect(analyticsClientSpy.track).toHaveBeenCalledTimes(3)
  })

  it('should be able to track page load event with correct params', () => {
    const { sut, analyticsClientSpy } = makeSut()
    const mockUrl = 'test-url-ABC/q-2/t'
    sut.pageLoad({
      url: mockUrl
    })

    sut.track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('Page Loaded', { url: mockUrl })
  })

  it('should return an error for invalid traits', () => {
    const { sut } = makeSut()

    expect(() => sut.assignGroupTraits(null)).toThrowError('Invalid traits provided')
  })

  it('should be able to add traits to each event called', () => {
    const { sut, analyticsClientSpy } = makeSut()
    const mockId = 'A-1-b-3-e-4'
    const mockUrl = '/t/q/testing'
    const secondMockUrl = '/p/v'
    const emailMock = 'email-test'

    sut.assignGroupTraits({
      id: mockId,
      email: emailMock
    })
    sut.pageLoad({
      url: mockUrl
    })
    sut.pageLoad({
      url: secondMockUrl
    })
    sut.track()

    expect(analyticsClientSpy.track).toHaveBeenNthCalledWith(1, 'Page Loaded', {
      url: mockUrl,
      id: mockId,
      email: emailMock
    })
    expect(analyticsClientSpy.track).toHaveBeenNthCalledWith(2, 'Page Loaded', {
      url: secondMockUrl,
      id: mockId,
      email: emailMock
    })
  })

  it('should be able to track click to create event with correct params', () => {
    const { sut, analyticsClientSpy } = makeSut()
    const productNameMock = 'Azion Product Name'

    sut.clickToCreate({
      productName: productNameMock
    })

    sut.track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith(
      'Clicked to Create Azion Product Name',
      {}
    )
  })

  it('should be able to track click to edit event with correct params', () => {
    const { sut, analyticsClientSpy } = makeSut()
    const productNameMock = 'Azion Product Name'

    sut.clickToEdit({
      productName: productNameMock
    })

    sut.track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('Clicked to Edit Azion Product Name', {})
  })

  it('should be able to track a product created successfully', () => {
    const { sut, analyticsClientSpy } = makeSut()
    const productNameMock = 'Azion Product Name Mock'

    sut
      .productCreated({
        productName: productNameMock
      })
      .track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('Created Azion Product Name Mock', {})
  })

  it('should be able to track a product edited successfully', () => {
    const { sut, analyticsClientSpy } = makeSut()
    const productNameMock = 'Azion Product Name Mock'

    sut
      .productEdited({
        productName: productNameMock
      })
      .track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('Edited Azion Product Name Mock', {})
  })

  it('should be able to track a failed event related to a product creation', () => {
    const { sut, analyticsClientSpy } = makeSut()
    const productNameMock = 'Azion Product Name Mock'

    sut
      .failedToCreate({
        productName: productNameMock
      })
      .track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith(
      'Failed to Create Azion Product Name Mock',
      {}
    )
  })

  it('should be able to track a failed event related to edit a product', () => {
    const { sut, analyticsClientSpy } = makeSut()
    const productNameMock = 'Azion Product Name Mock'

    sut
      .failedToEdit({
        productName: productNameMock
      })
      .track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith(
      'Failed to Edit Azion Product Name Mock',
      {}
    )
  })

  it('should call userSigned when valid identification is provided', () => {
    const { sut, analyticsClientSpy } = makeSut()

    sut.userSigned()

    sut.track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('User Signed In', {})
  })

  it('should call userFailedSignIn when valid identification is provided', () => {
    const { sut, analyticsClientSpy } = makeSut()

    sut.userFailedSignIn()

    sut.track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('User Failed to Sign In', {})
  })

  it('should use the create event with correct parameters', () => {
    const { sut, analyticsClientSpy } = makeSut()
    const mockUrl = 'test-url-ABC/q-2/t'
    const mockLocation = 'home'

    sut.createEventInHomeAndHeader({
      url: mockUrl,
      location: mockLocation
    })

    sut.track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('Clicked to Create', {
      url: mockUrl,
      location: mockLocation
    })
  })

  it('should track the user sign-up event with the correct parameters', () => {
    const { sut, analyticsClientSpy } = makeSut()

    sut.userSignedUp().track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('User Signed Up', {})
  })

  it('should track the additional data submit event with the correct parameters', () => {
    const { sut, analyticsClientSpy } = makeSut()

    sut.submittedAdditionalData().track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('Submitted Additional Data', {})
  })

  it('should track the user failed to sign-up event with the correct parameters', () => {
    const { sut, analyticsClientSpy } = makeSut()

    sut.userFailedSignUp().track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('User Failed to Sign Up', {})
  })

  it('should track the failed additional data submit event with the correct parameters', () => {
    const { sut, analyticsClientSpy } = makeSut()

    sut.failedSubmitAdditionalData().track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('Failed to Submit Additional Data', {})
  })

  it('should use the select create event with correct parameters', () => {
    const { sut, analyticsClientSpy } = makeSut()
    const selectionMock = 'cardTitle'
    const sectionMock = 'recommended'

    sut.selectedOnCreate({
      selection: selectionMock,
      section: sectionMock
    })

    sut.track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('Selected on Create', {
      selection: selectionMock,
      section: sectionMock
    })
  })

  it('should use the View More Details on Template event with correct parameters', () => {
    const { sut, analyticsClientSpy } = makeSut()

    const templateNameMock = 'string'
    const solutionIdMock = 'solutionId'
    const versionMock = 'version'
    const versionIdMock = 'versionID'
    const isvMock = 'isv'
    const isvIdMock = 'isvId'

    sut.clickMoreDetailsOnTemplate({
      templateName: templateNameMock,
      solutionId: solutionIdMock,
      version: versionMock,
      versionId: versionIdMock,
      isv: isvMock,
      isvId: isvIdMock
    })

    sut.track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith(
      'Clicked to View More Details on Template',
      {
        templateName: templateNameMock,
        solutionId: solutionIdMock,
        version: versionMock,
        versionId: versionIdMock,
        isv: isvMock,
        isvId: isvIdMock
      }
    )
  })

  it('should use the deployed event with correct parameters', () => {
    const { sut, analyticsClientSpy } = makeSut()

    sut.eventDeployed({})

    sut.track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('Deployed', {})
  })

  it('should track the account activation event with the correct parameters', () => {
    const { sut, analyticsClientSpy } = makeSut()

    sut.userActivatedAccount().track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('User Activated Account', {})
  })

  it('should use the failed deployed event with correct parameters', () => {
    const { sut, analyticsClientSpy } = makeSut()

    sut.eventFailedDeployed({})

    sut.track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('Failed to Deploy', {})
  })

  it('should be able to track click to create event with correct params', () => {
    const { sut, analyticsClientSpy } = makeSut()
    const productNameMock = 'Origin'
    
    sut.clickToCreate({
      productName: productNameMock
    })

    sut.track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('Clicked to Create Origin', {})
  })
})
