const makeDataStreamingBaseUrl = () => {
  const version = 'v3'
  return `${version}/data_streaming/streamings`
}

export { makeDataStreamingBaseUrl }
