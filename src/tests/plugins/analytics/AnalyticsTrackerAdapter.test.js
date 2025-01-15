import { AnalyticsTrackerAdapter } from '@/plugins/analytics/AnalyticsTrackerAdapter'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  application: 'console-kit'
}

const makeSut = () => {
  const analyticsClientSpy = {
    track: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn()
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
    sut.product.pageLoad({ url: 'test-url-1' }).product.pageLoad({ url: 'test-url-2' })
    sut.product.pageLoad({ url: 'test-url-3' })

    sut.track()

    expect(analyticsClientSpy.track).toHaveBeenCalledTimes(3)
  })

  it('should reset the analytics client and clear stored events', () => {
    const { sut, analyticsClientSpy } = makeSut()
    sut.identify('test-user-id')
    sut.product.pageLoad({ url: 'test-url-1' })
    sut.product.pageLoad({ url: 'test-url-2' })
    sut.reset()
    sut.track()

    expect(analyticsClientSpy.reset).toHaveBeenCalled()
    expect(sut.track).toHaveLength(0)
  })

  it('should be able to track page load event with correct params', () => {
    const { sut, analyticsClientSpy } = makeSut()
    const mockUrl = 'test-url-ABC/q-2/t'

    sut.product.pageLoad({
      url: mockUrl
    })

    sut.track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('Page Loaded', {
      url: mockUrl,
      application: fixtures.application
    })
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
    sut.product.pageLoad({
      url: mockUrl
    })
    sut.product.pageLoad({
      url: secondMockUrl
    })
    sut.track()

    expect(analyticsClientSpy.track).toHaveBeenNthCalledWith(1, 'Page Loaded', {
      url: mockUrl,
      id: mockId,
      email: emailMock,
      application: fixtures.application
    })
    expect(analyticsClientSpy.track).toHaveBeenNthCalledWith(2, 'Page Loaded', {
      url: secondMockUrl,
      id: mockId,
      email: emailMock,
      application: fixtures.application
    })
  })

  it('should be able to track click to create event with correct params', () => {
    const { sut, analyticsClientSpy } = makeSut()
    const productNameMock = 'Azion Product Name'

    sut.product.clickToCreate({
      productName: productNameMock
    })

    sut.track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('Clicked to Create Azion Product Name', {
      application: fixtures.application
    })
  })

  it('should be able to track click to edit event with correct params', () => {
    const { sut, analyticsClientSpy } = makeSut()
    const productNameMock = 'Azion Product Name'

    sut.product.clickToEdit({
      productName: productNameMock
    })

    sut.track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('Clicked to Edit Azion Product Name', {
      application: fixtures.application
    })
  })

  it('should be able to track a product created successfully', () => {
    const { sut, analyticsClientSpy } = makeSut()
    const productNameMock = 'Azion Product Name Mock'

    sut.product
      .productCreated({
        productName: productNameMock
      })
      .track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('Created Azion Product Name Mock', {
      application: fixtures.application
    })
  })

  it('should be able to track a product edited successfully', () => {
    const { sut, analyticsClientSpy } = makeSut()
    const productNameMock = 'Azion Product Name Mock'

    sut.product
      .productEdited({
        productName: productNameMock
      })
      .track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('Edited Azion Product Name Mock', {
      application: fixtures.application
    })
  })

  it('should be able to track a failed event related to a product creation', () => {
    const { sut, analyticsClientSpy } = makeSut()
    const productNameMock = 'Azion Product Name Mock'

    sut.product
      .failedToCreate({
        productName: productNameMock
      })
      .track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith(
      'Failed to Create Azion Product Name Mock',
      { application: fixtures.application }
    )
  })

  it('should be able to track a failed event related to edit a product', () => {
    const { sut, analyticsClientSpy } = makeSut()
    const productNameMock = 'Azion Product Name Mock'

    sut.product
      .failedToEdit({
        productName: productNameMock
      })
      .track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith(
      'Failed to Edit Azion Product Name Mock',
      { application: fixtures.application }
    )
  })

  it('should call userSigned when valid identification is provided', () => {
    const { sut, analyticsClientSpy } = makeSut()

    sut.signIn.userSignedIn()

    sut.track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('User Signed In', {
      application: fixtures.application
    })
  })

  it('should call userFailedSignIn when valid identification is provided', () => {
    const { sut, analyticsClientSpy } = makeSut()

    sut.signIn.userFailedSignIn()

    sut.track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('User Failed to Sign In', {
      application: fixtures.application
    })
  })

  it('should use the create event with correct parameters', () => {
    const { sut, analyticsClientSpy } = makeSut()
    const mockUrl = 'test-url-ABC/q-2/t'
    const mockLocation = 'home'

    sut.create.createEventInHomeAndHeader({
      url: mockUrl,
      location: mockLocation
    })

    sut.track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('Clicked to Create', {
      url: mockUrl,
      application: fixtures.application,
      location: mockLocation
    })
  })

  it('should track the user sign-up event with the correct parameters', () => {
    const { sut, analyticsClientSpy } = makeSut()

    sut.signUp.userSignedUp({ method: 'email' }).track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('User Signed Up', {
      method: 'email',
      application: fixtures.application
    })
  })

  it('should track the user authorized sso event with the correct parameters', () => {
    const { sut, analyticsClientSpy } = makeSut()

    sut.signUp.userAuthorizedSso({ method: 'google' }).track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('User Authorized SSO', {
      method: 'google',
      application: fixtures.application
    })
  })

  it('should track the user failed to sign-up event with the correct parameters', () => {
    const { sut, analyticsClientSpy } = makeSut()

    const propsMock = {
      errorType: 'api',
      fieldName: 'email',
      application: fixtures.application,
      errorMessage: 'Invalid email'
    }

    sut.signUp.userFailedSignUp({ ...propsMock }).track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('User Failed to Sign Up', propsMock)
  })

  it('should track the additional data submit event with the correct parameters', () => {
    const { sut, analyticsClientSpy } = makeSut()
    const propsMock = {
      use: 'Work',
      role: 'Other',
      inputRole: 'Other',
      companySize: '2 to 100',
      onboardingSession: true,
      companyWebsite: 'https://www.azion.com',
      fullName: 'John Doe'
    }

    const expectedResult = {
      application: fixtures.application,
      use: 'Work',
      role: 'Other',
      inputRole: 'Other',
      companySize: '2 to 100',
      onboardingSchedule: true,
      website: 'https://www.azion.com',
      name: 'John Doe'
    }

    sut.signUp.submittedAdditionalData(propsMock).track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith(
      'Submitted Additional Data',
      expectedResult
    )
  })

  it('should track the failed additional data submit event with the correct parameters', () => {
    const { sut, analyticsClientSpy } = makeSut()
    const propsMock = {
      application: fixtures.application,
      errorType: 'api',
      errorMessage: 'Error on submit',
      fieldName: 'field'
    }

    sut.signUp.failedSubmitAdditionalData(propsMock).track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith(
      'Failed to Submit Additional Data',
      propsMock
    )
  })

  it('should use the select create event with correct parameters', () => {
    const { sut, analyticsClientSpy } = makeSut()
    const selectionMock = 'cardTitle'
    const sectionMock = 'recommended'

    sut.create.selectedOnCreate({
      selection: selectionMock,
      section: sectionMock
    })

    sut.track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('Selected on Create', {
      application: fixtures.application,
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

    sut.create.clickMoreDetailsOnTemplate({
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
        application: fixtures.application,
        templateName: templateNameMock,
        solutionId: solutionIdMock,
        version: versionMock,
        versionId: versionIdMock,
        isv: isvMock,
        isvId: isvIdMock
      }
    )
  })

  it('should use the clicked to deploy event with correct parameters', () => {
    const { sut, analyticsClientSpy } = makeSut()
    const propsMock = {
      application: fixtures.application,
      isv: 'vendor',
      version: '1.0',
      versionId: '123',
      solutionId: '123',
      templateName: 'name'
    }

    sut.create.eventClickedToDeploy({ ...propsMock })

    sut.track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('Clicked to Deploy', propsMock)
  })

  it('should use the deployed event with correct parameters', () => {
    const { sut, analyticsClientSpy } = makeSut()
    const propsMock = {
      application: fixtures.application,
      isv: 'vendor',
      version: '1.0',
      versionId: '123',
      solutionId: '123',
      templateName: 'name'
    }

    sut.create.eventDeployed({ ...propsMock })

    sut.track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('Deployed', propsMock)
  })

  it('should track the account activation event with the correct parameters', () => {
    const { sut, analyticsClientSpy } = makeSut()

    sut.signUp.userActivatedAccount().track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('User Activated Account', {
      application: fixtures.application
    })
  })

  it('should use the failed deployed event with correct parameters', () => {
    const { sut, analyticsClientSpy } = makeSut()
    const propsMock = {
      application: fixtures.application,
      isv: 'vendor',
      version: '1.0',
      versionId: '123',
      solutionId: '123',
      templateName: 'name'
    }

    sut.create.eventFailedDeployed({ ...propsMock })

    sut.track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('Failed to Deploy', propsMock)
  })

  it('should be able to track click to create event with correct params', () => {
    const { sut, analyticsClientSpy } = makeSut()
    const productNameMock = 'Origin'

    sut.product.clickToCreate({
      productName: productNameMock
    })

    sut.track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('Clicked to Create Origin', {
      application: fixtures.application
    })
  })

  it('should be able to track created event with correct params', () => {
    const { sut, analyticsClientSpy } = makeSut()
    const productNameMock = 'Origin'

    sut.product.productCreated({
      productName: productNameMock
    })

    sut.track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('Created Origin', {
      application: fixtures.application
    })
  })

  it('should be able to track failed created event with correct params', () => {
    const { sut, analyticsClientSpy } = makeSut()
    const productNameMock = 'Origin'
    const errorMessageMock = 'message'
    const errorTypeMock = 'API'
    const fieldName = 'detail'

    sut.product.failedToCreate({
      productName: productNameMock,
      errorMessage: errorMessageMock,
      errorType: errorTypeMock,
      fieldName: fieldName
    })

    sut.track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('Failed to Create Origin', {
      application: fixtures.application,
      errorMessage: errorMessageMock,
      errorType: errorTypeMock,
      fieldName: fieldName
    })
  })

  it('should be able to track failed edited event with correct params', () => {
    const { sut, analyticsClientSpy } = makeSut()
    const productNameMock = 'Origin'
    const errorMessageMock = 'message'
    const errorTypeMock = 'API'
    const fieldName = 'detail'

    sut.product.failedToEdit({
      productName: productNameMock,
      errorMessage: errorMessageMock,
      errorType: errorTypeMock,
      fieldName: fieldName
    })

    sut.track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('Failed to Edit Origin', {
      application: fixtures.application,
      errorMessage: errorMessageMock,
      errorType: errorTypeMock,
      fieldName: fieldName
    })
  })

  it('should be able to track clicked on with correct params', () => {
    const { sut, analyticsClientSpy } = makeSut()
    const targetName = 'Search'

    sut.product.clickedOn({
      target: targetName
    })

    sut.track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('Clicked on Search', {
      application: fixtures.application
    })
  })

  it('should be able to track clicked to with correct params', () => {
    const { sut, analyticsClientSpy } = makeSut()
    const targetName = 'RTM'

    sut.product.clickedTo({
      target: targetName
    })

    sut.track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('Clicked to RTM', {
      application: fixtures.application
    })
  }

  // Waf Rules Tracker - Scenarios
  it('should be able to track click to allow rules with correct params', () => {
    const { sut, analyticsClientSpy } = makeSut()
    const originName = 'page'

    sut.wafRules.clickedToAllowRules({
      origin: originName
    })

    sut.track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('Clicked to Allow Rules', {
      application: fixtures.application,
      origin: 'page'
    })
  })

  it('should be able to track allow rules with correct params', () => {
    const { sut, analyticsClientSpy } = makeSut()
    const originName = 'page'

    sut.wafRules.allowedRules({
      origin: originName
    })

    sut.track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('Allowed Rules', {
      application: fixtures.application,
      origin: originName
    })
  })

  it('should be able to track failed edited event with correct params', () => {
    const { sut, analyticsClientSpy } = makeSut()
    const productNameMock = 'Origin'
    const errorMessageMock = 'message'
    const errorTypeMock = 'API'
    const fieldName = 'detail'
    const originName = 'page'

    sut.wafRules.failedToAllowRules({
      productName: productNameMock,
      errorMessage: errorMessageMock,
      errorType: errorTypeMock,
      fieldName: fieldName,
      origin: 'page'
    })

    sut.track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('Failed to Allow Rules', {
      application: fixtures.application,
      errorMessage: errorMessageMock,
      errorType: errorTypeMock,
      fieldName: fieldName,
      origin: originName
    })
  })

  it('should be able to track a Clicked on event', () => {
    const { sut, analyticsClientSpy } = makeSut()
    const productNameMock = 'Purge'
    const purgeType = 'cache key'

    sut.product.clickedOnEvent(productNameMock, {
      purgeType
    })

    sut.track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith('Clicked on Purge', {
      purgeType,
      application: fixtures.application
    })
  })

  it('should be able to track a realTimeMetrics', () => {
    const { sut, analyticsClientSpy } = makeSut()
    const eventName = 'Clicked on More Options on Real-Time Metrics'
    const payload = {
      chart: 'map chart',
      application: fixtures.application
    }

    sut.realTimeMetrics.clickedToRealTimeMetrics({ eventName, payload })

    sut.track()

    expect(analyticsClientSpy.track).toHaveBeenCalledWith(eventName, payload)
  })
})
