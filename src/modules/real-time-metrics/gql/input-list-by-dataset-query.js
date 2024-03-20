import { capitalizeFirstLetter } from '@/helpers'

/**
 * Returns all the input fields available to filter by dataset
 *
 * @param {dataset} datasetName Name of the Dataset
 * @returns JSON with query format
 */
export default (datasetName) => `
  query {
  __type(name: "${capitalizeFirstLetter(datasetName)}Filter") {
    inputFields {
      name
      description
      type {
        name
        inputFields {
          name
          type {
            name
            ofType {
              name
            }
          }
        }
      }
    }
  }
}`
