
/* if you have two environments for the same application */
// const environment = process.env.VITE_ENVIRONMENT || 'production';
// const config = require(`./azion/${environment}/azion.json`)

/* eslint-env node */
const config = require(`./azion/azion.json`)
const myDomain = config.domain.domain_name ?? 'console.azion.com'

const commonRules = [
  
  {
    name: 'Apply Common Configuration for All Requests',
    description: 'Applies common settings for all requests, including standard headers and HTTP to HTTPS redirection.',
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
    description: 'Sets the storage origin and deliver for all requests using the default object storage.',
    match: '.(css|js|ttf|woff|woff2|pdf|svg|jpg|jpeg|gif|bmp|png|ico|mp4|json|xml|html)$',
    behavior: {
      setOrigin: {
        name: 'origin-storage-default',
        type: 'object_storage'
      },
      deliver: true
    }
  },
  {
    name: 'Redirect All Non-Asset Requests to to index.html',
    description: 'Delivers static assets such as CSS, JS, images, and other files directly from object storage.',
    match: '^\\/',
    behavior: {
      rewrite: {
        set: () => `/index.html`
      }
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
    description: 'Routes marketplace API services to the manager origin, forwarding cookies and bypassing cache.',
    match: '^/api/marketplace',
    behavior: {
      setOrigin: {
        name: 'origin-manager',
        type: 'single_origin'
      },
      forwardCookies: true,
      rewrite: {
        match: '/api/marketplace/(.*)',
        subject: 'request_uri',
        set: (captured) => `/marketplace/api/${captured[1]}`
      },
      bypassCache: true,
    }
  },
  {
    name: 'Route Specific API Services to Template Engine Origin',
    description: 'Routes template-engine API services to the manager origin, forwarding cookies and bypassing cache.',
    match: '^/api/template-engine',
    behavior: {
      setOrigin: {
        name: 'origin-manager',
        type: 'single_origin'
      },
      forwardCookies: true,
      rewrite: {
        match: '/api/template-engine/(.*)',
        subject: 'request_uri',
        set: (captured) => `/template-engine/api/${captured[1]}`
      },
      bypassCache: true,
    }
  },
  {
    name: 'Route Specific API Services to Script Runner Origin',
    description: 'Routes script-runner API services to the script runner origin, forwarding cookies and bypassing cache.',
    match: '^/api/script-runner',
    behavior: {
      setOrigin: {
        name: 'origin-script-runner',
        type: 'single_origin'
      },
      forwardCookies: true,
      rewrite: {
        match: '/api/script-runner/(.*)',
        subject: 'request_uri',
        set: (captured) => `/script-runner/api/${captured[1]}`
      },
      bypassCache: true,
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
    name: 'Route GraphQL City Queries to Cities Origin',
    description: 'Routes GraphQL queries for cities to the specific cities origin.',
    match: '^/graphql/cities',
    behavior: {
      setOrigin: {
        name: 'origin-cities',
        type: 'single_origin'
      }
    }
  },
  {
    name: 'Route User Authentication and Account Management to SSO Origin',
    description: 'Routes user authentication and account management requests to the SSO origin, with cookie forwarding and cache bypass.',
    match: '^/api/(account|user|token|switch-account|auth|password|totp)|^/logout',
    behavior: {
      setOrigin: {
        name: 'origin-sso',
        type: 'single_origin'
      },
      forwardCookies: true,
      bypassCache: true,
    }
  }
]

const AzionConfig = {
  origin: [
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
    },
    // {
    //   name: 'origin-iam',
    //   type: 'single_origin',
    //   hostHeader: 'iam.azion.com',
    //   addresses: ['iam.azion.com']
    // },
    // {
    //   name: 'origin-variables',
    //   type: 'single_origin',
    //   hostHeader: 'variables.azion.com',
    //   addresses: ['variables.azion.com']
    // }
  ],
  rules: {
    request: [...commonRules, ...frontRules, ...backRules],
    response: [
      {
    
        name: 'Rewrite _azrt Cookie',
        description: 'Captures and rewrites the _azrt cookie from upstream responses, setting it with specific domain, path, and security settings.',
        match: '.*',
        variable: 'upstream_cookie__azrt',
        behavior: {
          capture: {
            match: '(.*)',
            captured: 'azrt_arr',
            subject: 'upstream_cookie__azrt'
          },
          setCookie: `_azrt=%{azrt_arr[0]}; Domain=${myDomain}; Max-Age=1209600; Path=/; SameSite=Lax; Secure`,
          filterCookie: '_azrt'
        }
      },
      {
        name: 'Rewrite azsid Cookie',
        description: 'Captures and rewrites the azsid cookie from upstream responses, applying new domain, expiration, and secure attributes.',
        match: '.*',
        variable: 'upstream_cookie_azsid',
        behavior: {
          capture: {
            match: '(.*)',
            captured: 'azsid_arr',
            subject: 'upstream_cookie_azsid'
          },
          setCookie: `azsid=%{azsid_arr[0]}; Domain=${myDomain}; Max-Age=1209600; Path=/; SameSite=Lax; Secure`,
          filterCookie: 'azsid'
        }
      },
      {
        name: 'Rewrite _azat Cookie',
        description: 'Captures and rewrites the _azat cookie from upstream responses, setting secure, domain-specific settings for enhanced security.',
        match: '.*',
        variable: 'upstream_cookie__azat',
        behavior: {
          capture: {
            match: '(.*)',
            captured: 'azat_arr',
            subject: 'upstream_cookie__azat'
          },
          setCookie: `_azat=%{azat_arr[0]}; Domain=${myDomain}; Max-Age=1209600; Path=/; SameSite=Lax; Secure`,
          filterCookie: '_azat'
        }
      },
      {
        name: 'Secure Headers',
        description: 'Sets various security headers to enhance the security posture of responses, including protections against clickjacking, XSS, and other web vulnerabilities.',
        match: '^\\/',
        behavior: {
          setHeaders: [
            'X-Frame-Options: SAMEORIGIN',
            'X-Content-Type-Options: nosniff',
            'Strict-Transport-Security: max-age=2592000; includeSubDomains',
            'Referrer-Policy: strict-origin-when-cross-origin',
            'X-XSS-Protection: 1; mode=block',
            'Cross-Origin-Opener-Policy: same-origin'
          ]
        }
      }
      // {
      //   name: 'CSP Header - Content Secure Policy',
      //  description: 'Sets a comprehensive Content Security Policy (CSP) header to enhance security by defining a whitelist of sources from which various types of resources can be loaded. This policy helps mitigate various types of attacks including Cross-Site Scripting (XSS) and data injection.',
      //   match: '^\\/',
      //   behavior: {
      //     setHeaders: [
      //       `Content-Security-Policy: default-src 'self' *.azion.com https://storage.googleapis.com cdn.segment.com api.segment.io; connect-src 'self' *.azion.com https://storage.googleapis.com cdn.segment.com api.segment.io https://www.google-analytics.com https://www.clarity.ms https://*.clarity.ms; frame-src https://feedback.fish *.azion.com https://www.google.com; frame-ancestors 'none'; upgrade-insecure-requests; block-all-mixed-content; style-src https://storage.googleapis.com https://console.azion.com https://fonts.azion.com cdn.jsdelivr.net 'unsafe-hashes' 'unsafe-inline'; font-src https://storage.googleapis.com https://console.azion.com https://fonts.azion.com data:; script-src https://storage.googleapis.com *.azion.com https://feedback.fish 'unsafe-inline' https://www.google-analytics.com https://www.googletagmanager.com https://www.clarity.ms https://*.clarity.ms; style-src-elem https://storage.googleapis.com *.azion.com https://feedback.fish cdn.jsdelivr.net 'unsafe-inline' https://${myDomain}; script-src-elem https://storage.googleapis.com *.azion.com https://feedback.fish https://cdn.jsdelivr.net https://cdn.segment.com https://www.google.com https://www.gstatic.com https://www.google-analytics.com https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://*.clarity.ms 'unsafe-inline' https://${myDomain}; img-src *`
      //     ]
      //   }
      // }
    ]
  }
}

module.exports = AzionConfig