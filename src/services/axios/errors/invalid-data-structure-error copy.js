export class InvalidDataStructureError extends Error {
  constructor() {
    super('Invalid data structure in HTTP response.')
    this.name = 'InvalidDataStructureError'
  }
}
