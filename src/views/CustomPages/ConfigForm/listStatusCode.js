const defaultValue = {
  type: 'PageDefault',
  customStatusCode: '-',
  connector: null,
  ttl: 0,
  contentType: 'text/html',
  response: '<html>...</html>'
}

export const STATUS_CODE_OPTIONS = [
  {
    id: 400,
    code: '400',
    name: 'Bad Request',
    ...defaultValue
  },
  {
    id: 401,
    code: '401',
    name: 'Unauthorized',
    ...defaultValue
  },
  {
    id: 403,
    code: '403',
    name: 'Forbidden',
    ...defaultValue
  },
  {
    id: 404,
    code: '404',
    name: 'Not Found',
    ...defaultValue
  },
  {
    id: 405,
    code: '405',
    name: 'Method Not Allowed',
    ...defaultValue
  },
  {
    id: 406,
    code: '406',
    name: 'Not Acceptable',
    ...defaultValue
  },
  {
    id: 408,
    code: '408',
    name: 'Request Timeout',
    ...defaultValue
  },
  {
    id: 409,
    code: '409',
    name: 'Conflict',
    ...defaultValue
  },
  {
    id: 410,
    code: '410',
    name: 'Gone',
    ...defaultValue
  },
  {
    id: 411,
    code: '411',
    name: 'Length Required',
    ...defaultValue
  },
  {
    id: 414,
    code: '414',
    name: 'URI Too Long',
    ...defaultValue
  },
  {
    id: 415,
    code: '415',
    name: 'Unsupported Media Type',
    ...defaultValue
  },
  {
    id: 416,
    code: '416',
    name: 'Range Not Satisfiable',
    ...defaultValue
  },
  {
    id: 426,
    code: '426',
    name: 'Upgrade Required',
    ...defaultValue
  },
  {
    id: 429,
    code: '429',
    name: 'Too Many Requests',
    ...defaultValue
  },
  {
    id: 431,
    code: '431',
    name: 'Request Header Fields Too Large',
    ...defaultValue
  },
  {
    id: 500,
    code: '500',
    name: 'Internal Server Error',
    ...defaultValue
  },
  {
    id: 501,
    code: '501',
    name: 'Not Implemented',
    ...defaultValue
  },
  {
    id: 502,
    code: '502',
    name: 'Bad Gateway',
    ...defaultValue
  },
  {
    id: 503,
    code: '503',
    name: 'Service Unavailable',
    ...defaultValue
  },
  {
    id: 504,
    code: '504',
    name: 'Gateway Timeout',
    ...defaultValue
  },
  {
    id: 505,
    code: '505',
    name: 'HTTP Version Not Supported',
    ...defaultValue
  }
]
