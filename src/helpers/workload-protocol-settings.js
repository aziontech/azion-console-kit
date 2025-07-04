export const SUPPORTED_VERSIONS = {
  default: ['http1', 'http2'],
  withHttp3: ['http1', 'http2', 'http3']
}
export const HTTP_PORT_LIST_OPTIONS = [
  { name: '80 (Default)', value: 80 },
  { name: '8008', value: 8008 },
  { name: '8080', value: 8080 },

  // Custom Ports
  { name: '8880', value: 8880 }
]
export const HTTP3_PORT_LIST_OPTIONS = [{ name: '443 (Default)', value: 443 }]
export const HTTPS_PORT_LIST_OPTIONS = [
  { name: '443 (Default)', value: 443 },
  { name: '8443', value: 8443 },
  { name: '9440', value: 9440 },
  { name: '9441', value: 9441 },
  { name: '9442', value: 9442 },
  { name: '9443', value: 9443 },

  // Custom Ports
  { name: '7777', value: 7777 },
  { name: '8888', value: 8888 },
  { name: '9553', value: 9553 },
  { name: '9653', value: 9653 },
  { name: '8035', value: 8035 },
  { name: '8090', value: 8090 }
]

export const TLS_VERSIONS_OPTIONS = [
  { label: 'None', value: '' },
  { label: 'TLS v1.3 (Default)', value: 'tls_1_3' },
  { label: 'TLS v1.2', value: 'tls_1_2' },
  { label: 'TLS v1.1 (Deprecated)', value: 'tls_1_1' },
  { label: 'TLS v1.0 (Deprecated)', value: 'tls_1_0' }
]

export const SUPPORTED_CIPHERS_LIST_OPTIONS = [
  { label: 'Legacy v2018Q1 - TLS 1.2', value: 1 },
  { label: 'Compatible v2018Q1 - TLS 1.2', value: 2 },
  { label: 'Modern v2022Q1 - TLS 1.2', value: 3 },
  { label: 'Modern v2022Q1 - (migration TLS 1.3)', value: 4 },
  { label: 'Legacy v2025Q1', value: 5 },
  { label: 'Compatible v2025Q1', value: 6 },
  { label: 'Modern v2025Q1', value: 7 },
  { label: 'Legacy v2017Q1 - All Ciphers', value: 8 }
]
