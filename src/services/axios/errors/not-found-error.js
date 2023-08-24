export class NotFoundError extends Error{
  constructor(){
    super('Resourse not found.')
    this.name = 'NotFoundError'
  }
}