export class UnexpectedError extends Error {
  constructor() {
    super('Unexpected error.')
    this.name = 'UnexpectedError'
  }
}
