const formatViewDataTest = (data) => {
  return {
    tester: data && data.tester,
    loadTime: data && data.loadTime,
    totalBlockingTime: data && data.TotalBlockingTime, // TBT
    firstContentfulPaint: data && data.firstContentfulPaint,
    bytesOut: data && data.bytesOut,
    bytesOutDoc: data && data.bytesOutDoc,
    bytesIn: data && data.bytesIn, // Page Weight
    url: data && data.URL,
    final_url: data && data.final_url,
    ttfb: data && data.TTFB,
    render: data && data.render, // Start Render
    speedIndex: data && data.SpeedIndex,
    basePageSSLTime: data && data.basePageSSLTime,
    score_cache: data && data.loascore_cachedTime,
    score_cdn: data && data.score_cdn,
    score_gzip: data && data.score_gzip,
    'score_keep-alive': data && data['score_keep-alive'],
    score_compress: data && data.score_compress,
    score_progressive_jpeg: data && data.score_progressive_jpeg,
    gzip_total: data && data.gzip_total,
    gzip_savings: data && data.gzip_savings,
    image_total: data && data.image_total,
    image_savings: data && data.image_savings,
    base_page_cdn: data && data.base_page_cdn,
    document_URL: data && data.document_URL,
    document_hostname: data && data.document_hostname,
    document_origin: data && data.document_origin,
    base_page_dns_server: data && data && data.loadTime,
    server_rtt: data && data.server_rtt,
    securityHeaders: {
      securityHeadersList:
        data && data.securityHeaders ? data.securityHeaders.securityHeadersList : [],
      securityHeadersGrade:
        data && data.securityHeaders ? data.securityHeaders.securityHeadersGrade : '',
      securityHeadersScore:
        data && data.securityHeaders ? data.securityHeaders.securityHeadersScore : ''
    },
    chromeUserTiming: {
      firstContentfulPaint: data && data['chromeUserTiming.firstContentfulPaint'],
      largestContentfulPaint: data && data['chromeUserTiming.LargestContentfulPaint'],
      cumulativeLayoutShift: data && data['chromeUserTiming.CumulativeLayoutShift']
    },
    detected: {
      ecommerce: data && data.detected ? data.detected.Ecommerce : '',
      cdn: data && data.detected ? data.detected.CDN : '',
      webServers: data && data.detected ? data.detected['Web servers'] : ''
    },
    requests: extract.requestList(data && data.requests ? data.requests : [])
  }
}

const formatRequestDataTest = (request) => {
  return {
    ip_addr: request.ip_addr,
    full_url: request.full_url,
    method: request.method,
    host: request.host,
    url: request.url,
    documentURL: request.documentURL,
    responseCode: request.responseCode,
    request_type: request.request_type,
    load_ms: request.load_ms,
    ttfb_ms: request.ttfb_ms,
    load_start: request.load_start,
    bytesIn: request.bytesIn,
    objectSize: request.objectSize,
    objectSizeUncompressed: request.objectSizeUncompressed,
    contentType: request.contentType,
    securityDetails: {
      tls_version: request.securityDetails ? request.securityDetails.tls_version : '',
      protocol: request.securityDetails ? request.securityDetails.protocol : '',
      sanList: request.securityDetails ? request.securityDetails.sanList : []
    },
    server_rtt: request.server_rtt,
    bytesOut: request.bytesOut,
    dns_ms: request.dns_ms,
    connect_ms: request.connect_ms,
    ssl_ms: request.ssl_ms
  }
}

export const extract = {
  medianFirstView: (testData) => formatViewDataTest(testData.data.median.firstView),
  medianRepeatView: (testData) => formatViewDataTest(testData.data.median.repeatView),
  requestList: (requests) => {
    const lst = []
    requests.forEach((request) => lst.push(formatRequestDataTest(request)))
    return lst
  }
}
