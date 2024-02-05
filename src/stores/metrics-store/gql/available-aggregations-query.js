import { capitalizeFirstLetter } from '@/helpers'

/**
 * Returns all the input fields available to filter by dataset
 *
 * @param {dataset} datasetName Name of the Dataset
 * @returns JSON with query format
 */
export default (datasetName) => `
  query {
  __type(name: "${capitalizeFirstLetter(datasetName)}AggregatedOptions") {
    inputFields {
      name
      description
      type {
        name
        enumValues {
          name
        }
      }
    }
  }
}`
