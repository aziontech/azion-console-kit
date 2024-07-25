export class NotAcceptableError extends Error {
  constructor() {
    super(`Content sent was not accepted by server`)
    this.name = 'NotAcceptableError'
  }
}
