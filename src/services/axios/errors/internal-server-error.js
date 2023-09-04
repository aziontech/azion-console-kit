export class InternalServerError extends Error {
  constructor() {
    super('Something went wrong, please try again.')
    this.name = 'InternalServerError'
  }
}
