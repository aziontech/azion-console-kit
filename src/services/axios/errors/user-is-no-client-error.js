export class UserIsNotClientError extends Error {
  constructor() {
    super('User must be of type client.')
    this.name = 'UserIsNotClientError'
  }
}
