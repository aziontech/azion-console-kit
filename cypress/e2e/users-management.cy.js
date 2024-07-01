import generateUniqueName from '../support/utils'
import selectors from '../support/selectors'

const userFirstName = generateUniqueName('FirstName')
const userLastName = generateUniqueName('LastName')
const userEmail = `${userFirstName}@azion.com`

describe('Users Management spec', () => {
  beforeEach(() => {
    cy.login()
    cy.openItemThroughMenuAccount('Users Management')
  })

  it('should create a new user', () => {
    // Arrange
    cy.get('[data-testid="create_User_button"]').click()
  })

  afterEach(() => {
    // Delete the user
  })
})
