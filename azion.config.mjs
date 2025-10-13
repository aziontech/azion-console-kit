import { defineConfig } from 'azion'
import process from 'node:process'

const { CROSS_EDGE_SECRET, VITE_ENVIRONMENT } = process.env

const environment = VITE_ENVIRONMENT || 'production'

const addStagePrefix = (origin) => {
  if (environment === 'stage') {
    return origin?.map(({ hostHeader, addresses, ...rest }) => {
      const isCitiesDomain = hostHeader === 'cities.azion.com'
      const transform = (addr) => `stage-${isCitiesDomain ? addr.replace('.com', '.net') : addr}`

      return {
        ...rest,
        hostHeader: transform(hostHeader),
        addresses: addresses?.map(transform)
      }
    })
  }
  return origin
}

const addStageSuffixToCookies = (cookieName) => {
  return environment === 'stage' ? `${cookieName}_stg` : cookieName
}

const createCookieRewriteRule = ({ cookieName, description, prefix = '', hasConfigMaxAge }) => {
  const formattedCookieName = prefix + addStageSuffixToCookies(cookieName)

  const domains = [
    { domain: 'azion.com', regex: '.*(azion\\.com)' },
    { domain: 'azionedge.net', regex: '.*(map\\.azionedge\\.net)' }
  ]

  return domains.map(({ domain, regex }) => ({
    name: `Rewrite ${cookieName} Cookie in ${domain}`,
    description,
    criteria: [
      {
        variable: `\${upstream_cookie_${formattedCookieName}}`,
        conditional: 'if',
        operator: 'matches',
        inputValue: '.*'
      },
      {
        variable: '${host}',
        conditional: 'and',
        operator: 'matches',
        inputValue: regex
      }
    ],
    behavior: {
      capture: {
        match: '(.*)',
        captured: `${cookieName}_arr`,
        subject: `upstream_cookie_${formattedCookieName}`
      },
      setCookie: `${formattedCookieName}=%{${cookieName}_arr[0]};${
        hasConfigMaxAge ? ' Max-Age=1209600; ' : ' '
      }Path=/; SameSite=Lax; Secure; Domain=${domain}`,
      ...(hasConfigMaxAge ? { filterCookie: formattedCookieName } : {})
    }
  }))
}

const cookieRewriteRules = [
  ...createCookieRewriteRule({
    cookieName: 'azrt',
    description:
      'Captures and rewrites the _azrt cookie from upstream responses, setting it with specific domain, path, and security settings.',
    prefix: '_',
    hasConfigMaxAge: true
  }),
  ...createCookieRewriteRule({
    cookieName: 'azsid',
    description:
      'Captures and rewrites the azsid cookie from upstream responses, applying new domain, expiration, and secure attributes.',
    prefix: '',
    hasConfigMaxAge: false
  }),
  ...createCookieRewriteRule({
    cookieName: 'azat',
    description:
      'Captures and rewrites the _azat cookie from upstream responses, setting secure, domain-specific settings for enhanced security.',
    prefix: '_',
    hasConfigMaxAge: true
  })
]

const config = {
  build: {
    preset: 'vue'
  },
  origin: [
    ...addStagePrefix([
      {
        name: 'origin-storage-default',
        type: 'object_storage'
      },
      {
        name: 'origin-billing',
        type: 'single_origin',
        hostHeader: `billing-api.azion.net`,
        addresses: [`billing-api.azion.net`]
      },
      {
        name: 'origin-script-runner',
        type: 'single_origin',
        hostHeader: `script-runner.azion.com`,
        addresses: [`script-runner.azion.com`]
      },
      {
        name: 'origin-template-engine',
        type: 'single_origin',
        hostHeader: `template-engine.azion.com`,
        addresses: [`template-engine.azion.com`]
      },
      {
        name: 'origin-iam-api',
        type: 'single_origin',
        hostHeader: `iam-api.azion.net`,
        addresses: [`iam-api.azion.net`]
      },
      {
        name: 'origin-marketplace',
        type: 'single_origin',
        hostHeader: `marketplace.azion.com`,
        addresses: [`marketplace.azion.com`]
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
      }
    ]),
    {
      name: 'origin-console-feedback',
      type: 'single_origin',
      hostHeader: `automate.azion.net`,
      addresses: [`automate.azion.net`]
    }
  ],
  cache: [
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
  ],
  rules: {
    request: [
      {
        name: 'Apply Common Configuration for All Requests',
        description:
          'Applies common settings for all requests, including standard headers and HTTP to HTTPS redirection.',
        match: '^\\/',
        behavior: {
          setHeaders: [
            'Accept: application/json; version=3;',
            'X-Cross-Edge-Secret: ' + CROSS_EDGE_SECRET || 'secret',
            'X-User-Real-IP: ${remote_addr}'
          ],
          bypassCache: true,
          forwardCookies: true,
          httpToHttps: true
        }
      },
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
        match:
          '^(?!.*edge_storage).*.(css|js|ttf|woff|woff2|pdf|svg|jpg|jpeg|gif|bmp|png|ico|mp4|json|xml|html)$',
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
      },
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
            name: 'origin-marketplace',
            type: 'single_origin'
          },
          forwardCookies: true,
          capture: {
            match: '/api/marketplace/(.*)',
            captured: 'captured',
            subject: 'request_uri'
          },
          rewrite: `/marketplace/api/%{captured[1]}`
        }
      },
      {
        name: 'Route Specific API Services to Template Engine Origin',
        description:
          'Routes template-engine API services to the template engine origin, forwarding cookies and bypassing cache.',
        match: '^/api/template-engine',
        behavior: {
          setOrigin: {
            name: 'origin-template-engine',
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
      },
      {
        name: 'Billing PDF',
        description: 'Enable users do download billing PDF.',
        match: '^/billing/invoices',
        behavior: {
          setOrigin: {
            name: 'origin-billing',
            type: 'single_origin'
          },
          capture: {
            match: '/billing/invoices/([0-9]{2}-[0-9]{4})',
            captured: 'captured',
            subject: 'request_uri'
          },
          rewrite: `/billing/invoices/%{captured[1]}`,
          forwardCookies: true
        }
      },
      {
        name: 'API Version 4 Routing',
        description: 'Directs API version 4 requests to the designated API origin for handling.',
        match: '^/v4',
        behavior: {
          setOrigin: {
            name: 'origin-api',
            type: 'single_origin'
          }
        }
      },
      {
        name: 'Route Send Feedback',
        description: 'this route will send user feedback to jira',
        match: '^/api/webhook/console_feedback',
        behavior: {
          forwardCookies: true,
          setOrigin: {
            name: 'origin-console-feedback',
            type: 'single_origin'
          },
          rewrite: '/webhook/console_feedback'
        }
      },
      {
        name: 'Route API Identity Providers',
        description: 'Routes API requests for identity providers',
        match: '^/api/iam',
        behavior: {
          forwardCookies: true,
          setOrigin: {
            name: 'origin-iam-api',
            type: 'single_origin'
          },
          capture: {
            match: '/api/iam/(.*)',
            captured: 'captured',
            subject: 'request_uri'
          },
          rewrite: `/iam/api/%{captured[1]}`
        }
      }
    ],
    response: [
      ...cookieRewriteRules,
      {
        name: 'OAuth Security Headers - Login and Signup',
        description:
          'Applies strict COOP headers only to authentication-related pages to protect OAuth flows without breaking external links.',
        match: '^/(login|signup|switch-account|mfa)',
        behavior: {
          setHeaders: ['Cross-Origin-Opener-Policy: same-origin']
        }
      },
      {
        name: 'OAuth Security Headers - GitHub Connection',
        description: 'Applies strict COOP headers to GitHub connection popup pages.',
        match: '^/github-connection-popup',
        behavior: {
          setHeaders: ['Cross-Origin-Opener-Policy: same-origin']
        }
      },
      {
        name: 'Secure Headers - General',
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

export default defineConfig(config)
