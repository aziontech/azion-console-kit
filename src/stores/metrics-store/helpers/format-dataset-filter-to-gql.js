export default function FormatDatasetFilterToGql(datasets = []) {
  const datasetFilter = {}

  datasets.forEach((dataset) => {
    const inList = dataset.in.map((datasetIn) => datasetIn.sourceId)
    datasetFilter[dataset.fieldName] = inList
  })
  return datasetFilter
}
