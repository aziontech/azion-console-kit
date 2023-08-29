export class InvalidApiTokenError extends Error{
  constructor(){
    super('Invalid API token')
    this.name = 'InvalidApiTokenError'
  }
}