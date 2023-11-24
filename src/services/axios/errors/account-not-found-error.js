export class AccountNotFoundError extends Error {
  constructor() {
    super('No account found')
    this.name = 'AccountNotFoundError'
  }
}
