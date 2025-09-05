function makeSegmentToken() {
  const segmentToken = import.meta.env['VITE_SEGMENT_TOKEN']

  if (!segmentToken) {
    // eslint-disable-next-line
    console.warn('Segment token is missing')
    return
  }

  return segmentToken
}

export { makeSegmentToken }
