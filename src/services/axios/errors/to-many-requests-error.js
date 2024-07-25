export class ToManyRequestsError extends Error {
  constructor() {
    super('To many requests, please try again later.')
    this.name = 'ToManyRequestsError'
  }
}
