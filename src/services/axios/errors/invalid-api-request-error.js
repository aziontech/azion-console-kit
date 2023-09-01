export class InvalidApiRequestError extends Error {
  constructor() {
    super('Invalid API request')
    this.name = 'InvalidApiRequestError'
  }
}
