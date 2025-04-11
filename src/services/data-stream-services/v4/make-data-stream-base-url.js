const makeDataStreamBaseUrl = () => {
  const version = 'v4'
  return `${version}/data_stream/streams`
}

export { makeDataStreamBaseUrl }