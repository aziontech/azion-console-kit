export class UserNotFoundError extends Error {
  constructor() {
    super(`E-mail and password don't match with any account.`)
    this.name = 'UserNotFoundError'
  }
}
