export class ProccessRequestError extends Error {
  constructor() {
    super('Error while processing request.')
    this.name = 'ProccessRequestError'
  }
}
