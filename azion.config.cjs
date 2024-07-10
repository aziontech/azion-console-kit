/* if you have two environments for the same application
/* you can import your config based on environment value, 
/* ex: require(`./azion/${environment}/azion.json`)
*/
/* eslint-env node */
const environment = process.env.MODE || 'production'

// eslint-disable-next-line no-console
console.log('🚀 ~ process.env:', process.env.MODE)

const addStagePrefix = (origin) => {
  if (environment === 'stage') {
    return origin?.map((origin) => ({
      ...origin,
      hostHeader: `stage-${origin.hostHeader}`,
      addresses: origin.addresses?.map((addr) => `stage-${addr}`)
    }))
  }
  return origin
}

const addStageSuffixToCookies = (cookieName) => {
  return environment === 'stage' ? `${cookieName}_stg` : cookieName
}

const cacheConfig = [
  {
    name: 'Statics - Cache',
    stale: false,
    queryStringSort: false,
    cacheByQueryString: {
      option: 'ignore'
    },
    methods: {
      post: false,
      options: false
    },
    browser: {
      maxAgeSeconds: 1000 * 5 // 5000 seconds
    },
    edge: {
      maxAgeSeconds: 60 * 60 * 24 * 5 // 5 days
    }
  },
  {
    name: 'Marketplace - Cache',
    stale: false,
    queryStringSort: false,
    cacheByQueryString: {
      option: 'varies'
    },
    methods: {
      post: false,
      options: false
    },
    edge: {
      maxAgeSeconds: 60 * 60 * 24 * 2 // 2 days
    }
  },
  {
    name: 'Cities - Cache',
    stale: false,
    queryStringSort: false,
    cacheByQueryString: {
      option: 'varies'
    },
    methods: {
      post: false,
      options: false
    },
    browser: {
      maxAgeSeconds: 1000 * 10 // 10000 seconds
    },
    edge: {
      maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
    }
  }
]

const commonRules = [
  {
    name: 'Apply Common Configuration for All Requests',
    description:
      'Applies common settings for all requests, including standard headers and HTTP to HTTPS redirection.',
    match: '^\\/',
    behavior: {
      setHeaders: ['Accept: application/json; version=3;'],
      bypassCache: true,
      forwardCookies: true,
      httpToHttps: true
    }
  }
]

const frontRules = [
  {
    name: 'Set Storage Origin for All Requests',
    description: 'Sets the default object storage as the origin for all requests.',
    match: '^\\/',
    behavior: {
      setOrigin: {
        name: 'origin-storage-default',
        type: 'object_storage'
      }
    }
  },
  {
    name: 'Deliver Static Assets from Storage',
    description:
      'Sets the storage origin and deliver for all requests using the default object storage.',
    match: '.(css|js|ttf|woff|woff2|pdf|svg|jpg|jpeg|gif|bmp|png|ico|mp4|json|xml|html)$',
    behavior: {
      setOrigin: {
        name: 'origin-storage-default',
        type: 'object_storage'
      },
      setCache: 'Statics - Cache',
      deliver: true
    }
  },
  {
    name: 'Redirect All Non-Asset Requests to to index.html',
    description:
      'Delivers static assets such as CSS, JS, images, and other files directly from object storage.',
    match: '^\\/',
    behavior: {
      rewrite: `/index.html`
    }
  }
]

const backRules = [
  {
    name: 'Route API Default Requests to API Origin',
    description: 'Routes all default API requests to the specific API origin.',
    match: '^/api',
    behavior: {
      setOrigin: {
        name: 'origin-api',
        type: 'single_origin'
      }
    }
  },
  {
    name: 'Route Specific API Services to Marketplace Origin',
    description:
      'Routes marketplace API services to the manager origin, forwarding cookies and bypassing cache.',
    match: '^/api/marketplace',
    behavior: {
      setOrigin: {
        name: 'origin-manager',
        type: 'single_origin'
      },
      forwardCookies: true,
      capture: {
        match: '/api/marketplace/(.*)',
        captured: 'captured',
        subject: 'request_uri'
      },
      rewrite: `/marketplace/api/%{captured[1]}`,
      setCache: 'Marketplace - Cache'
    }
  },
  {
    name: 'Route Specific API Services to Template Engine Origin',
    description:
      'Routes template-engine API services to the manager origin, forwarding cookies and bypassing cache.',
    match: '^/api/template-engine',
    behavior: {
      setOrigin: {
        name: 'origin-manager',
        type: 'single_origin'
      },
      forwardCookies: true,
      capture: {
        match: '/api/template-engine/(.*)',
        captured: 'captured',
        subject: 'request_uri'
      },
      rewrite: `/template-engine/api/%{captured[1]}`,
      bypassCache: true
    }
  },
  {
    name: 'Route Specific API Services to Script Runner Origin',
    description:
      'Routes script-runner API services to the script runner origin, forwarding cookies and bypassing cache.',
    match: '^/api/script-runner',
    behavior: {
      setOrigin: {
        name: 'origin-script-runner',
        type: 'single_origin'
      },
      forwardCookies: true,
      capture: {
        match: '/api/script-runner/(.*)',
        captured: 'captured',
        subject: 'request_uri'
      },
      rewrite: `/script-runner/api/%{captured[1]}`,
      bypassCache: true
    }
  },
  {
    name: 'Route Version Control System API to VCS Origin',
    description: 'Routes version control system API requests to the VCS origin.',
    match: '^/api/vcs',
    behavior: {
      setOrigin: {
        name: 'origin-vcs',
        type: 'single_origin'
      }
    }
  },
  {
    name: 'Route User Authentication and Account Management to SSO Origin',
    description:
      'Routes user authentication and account management requests to the SSO origin, with cookie forwarding and cache bypass.',
    match: '^/api/(account|user|token|switch-account|auth|password|totp)|^/logout',
    behavior: {
      setOrigin: {
        name: 'origin-sso',
        type: 'single_origin'
      },
      forwardCookies: true,
      bypassCache: true
    }
  },
  {
    name: 'Route GraphQL City Queries to Cities Origin',
    description: 'Routes GraphQL queries for cities to the specific cities origin.',
    match: '^/graphql/cities/',
    behavior: {
      forwardCookies: true,
      setOrigin: {
        name: 'origin-cities',
        type: 'single_origin'
      },
      rewrite: '/graphql/',
      setCache: 'Cities - Cache'
    }
  }
]

const AzionConfig = {
  cache: [...cacheConfig],
  origin: addStagePrefix([
    {
      name: 'origin-storage-default',
      type: 'object_storage'
    },
    {
      name: 'origin-manager',
      type: 'single_origin',
      hostHeader: `manager-origin.azion.com`,
      addresses: [`manager-origin.azion.com`]
    },
    {
      name: 'origin-vcs',
      type: 'single_origin',
      hostHeader: `vcs-api.azion.net`,
      addresses: [`vcs-api.azion.net`]
    },
    {
      name: 'origin-cities',
      type: 'single_origin',
      hostHeader: `cities.azion.com`,
      addresses: [`cities.azion.com`]
    },
    {
      name: 'origin-sso',
      type: 'single_origin',
      hostHeader: `sso.azion.com`,
      addresses: [`sso.azion.com`]
    },
    {
      name: 'origin-api',
      type: 'single_origin',
      hostHeader: `api.azion.com`,
      addresses: [`api.azion.com`]
    },
    {
      name: 'origin-script-runner',
      type: 'single_origin',
      hostHeader: 'script-runner.azion.com',
      addresses: ['script-runner.azion.com']
    }
  ]),
  rules: {
    request: [...commonRules, ...frontRules, ...backRules],
    response: [
      {
        name: 'Rewrite _azrt Cookie',
        description:
          'Captures and rewrites the _azrt cookie from upstream responses, setting it with specific domain, path, and security settings.',
        match: '.*',
        variable: `upstream_cookie_${addStageSuffixToCookies('_azrt')}`,
        behavior: {
          capture: {
            match: '(.*)',
            captured: 'azrt_arr',
            subject: `upstream_cookie_${addStageSuffixToCookies('_azrt')}`
          },
          setCookie: `${addStageSuffixToCookies(
            '_azrt'
          )}=%{azrt_arr[0]}; Max-Age=1209600; Path=/; SameSite=Lax; Secure`,
          filterCookie: addStageSuffixToCookies('_azrt')
        }
      },
      {
        name: 'Rewrite azsid Cookie',
        description:
          'Captures and rewrites the azsid cookie from upstream responses, applying new domain, expiration, and secure attributes.',
        match: '.*',
        variable: `upstream_cookie_${addStageSuffixToCookies('azsid')}`,
        behavior: {
          capture: {
            match: '(.*)',
            captured: 'azsid_arr',
            subject: `upstream_cookie_${addStageSuffixToCookies('azsid')}`
          },
          setCookie: `${addStageSuffixToCookies(
            'azsid'
          )}=%{azsid_arr[0]}; Max-Age=1209600; Path=/; SameSite=Lax; Secure`,
          filterCookie: addStageSuffixToCookies('azsid')
        }
      },
      {
        name: 'Rewrite _azat Cookie',
        description:
          'Captures and rewrites the _azat cookie from upstream responses, setting secure, domain-specific settings for enhanced security.',
        match: '.*',
        variable: `upstream_cookie_${addStageSuffixToCookies('_azat')}`,
        behavior: {
          capture: {
            match: '(.*)',
            captured: 'azat_arr',
            subject: `upstream_cookie_${addStageSuffixToCookies('_azat')}`
          },
          setCookie: `${addStageSuffixToCookies(
            '_azat'
          )}=%{azat_arr[0]}; Max-Age=1209600; Path=/; SameSite=Lax; Secure`,
          filterCookie: addStageSuffixToCookies('_azat')
        }
      },
      {
        name: 'Secure Headers',
        description:
          'Sets various security headers to enhance the security posture of responses, including protections against clickjacking, XSS, and other web vulnerabilities.',
        match: '^\\/',
        behavior: {
          setHeaders: [
            'X-Frame-Options: SAMEORIGIN',
            'X-Content-Type-Options: nosniff',
            'Strict-Transport-Security: max-age=2592000; includeSubDomains',
            'Referrer-Policy: strict-origin-when-cross-origin',
            'X-XSS-Protection: 1; mode=block',
            'Cross-Origin-Opener-Policy: unsafe-none'
          ]
        }
      }
    ]
  }
}

module.exports = AzionConfig
