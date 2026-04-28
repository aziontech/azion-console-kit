/* eslint-disable no-useless-escape */
import { defineConfig } from 'azion'

export default defineConfig({
  build: {
    preset: 'html',
    polyfills: true
  },
  storage: [
    {
      name: 'console-kit-storybook',
      prefix: '20260413110920',
      dir: './dist',
      workloadsAccess: 'read_only'
    }
  ],
  connectors: [
    {
      name: 'azion-console-kit-storybook',
      active: true,
      type: 'storage',
      attributes: {
        bucket: 'console-kit-storybook',
        prefix: '20260413110920'
      }
    }
  ],
  applications: [
    {
      name: 'azion-console-kit-storybook',
      cache: [
        {
          name: 'azion-console-kit-storybook',
          browser: {
            maxAgeSeconds: 300
          },
          edge: {
            maxAgeSeconds: 7200
          }
        }
      ],
      rules: {
        request: [
          {
            name: 'Default Rule',
            description: 'For all requests',
            active: true,
            criteria: [
              [
                {
                  variable: '${uri}',
                  conditional: 'if',
                  operator: 'starts_with',
                  argument: '/'
                }
              ]
            ],
            behaviors: [
              {
                type: 'set_connector',
                attributes: {
                  value: 'azion-console-kit-storybook'
                }
              }
            ]
          },
          {
            name: 'Static Assets and Set Cache Policy',
            description:
              'Deliver static assets directly from storage and set cache policy',
            active: false,
            criteria: [
              [
                {
                  variable: '${uri}',
                  conditional: 'if',
                  operator: 'matches',
                  argument:
                    '\.(jpg|jpeg|png|gif|bmp|webp|svg|ico|ttf|otf|woff|woff2|eot|pdf|doc|docx|xls|xlsx|ppt|pptx|mp4|webm|mp3|wav|ogg|css|js|json|xml|html|txt|csv|zip|rar|7z|tar|gz|webmanifest|map|md|yaml|yml)$'
                }
              ]
            ],
            behaviors: [
              {
                type: 'set_connector',
                attributes: {
                  value: 'azion-console-kit-storybook'
                }
              },
              {
                type: 'set_cache_policy',
                attributes: {
                  value: 'azion-console-kit-storybook'
                }
              }
            ]
          },
          {
            name: 'Redirect to index.html',
            description: 'Handle directory requests by rewriting to index.html',
            active: true,
            criteria: [
              [
                {
                  variable: '${uri}',
                  conditional: 'if',
                  operator: 'matches',
                  argument: '.*/$'
                }
              ]
            ],
            behaviors: [
              {
                type: 'set_connector',
                attributes: {
                  value: 'azion-console-kit-storybook'
                }
              },
              {
                type: 'rewrite_request',
                attributes: {
                  value: '${uri}index.html'
                }
              }
            ]
          },
          {
            name: 'Redirect to index.html for Subpaths',
            description: 'Handle subpath requests by rewriting to index.html',
            active: false,
            criteria: [
              [
                {
                  variable: '${uri}',
                  conditional: 'if',
                  operator: 'matches',
                  argument: '^(?!.*\/$)(?![\s\S]*\.[a-zA-Z0-9]+$).*'
                }
              ]
            ],
            behaviors: [
              {
                type: 'set_connector',
                attributes: {
                  value: 'azion-console-kit-storybook'
                }
              },
              {
                type: 'rewrite_request',
                attributes: {
                  value: '${uri}/index.html'
                }
              }
            ]
          }
        ],
        response: [
          {
            name: 'Debug',
            description: 'Set header -- x-azion-debug',
            active: false,
            criteria: [
              [
                {
                  variable: '${uri}',
                  conditional: 'if',
                  operator: 'starts_with',
                  argument: '/'
                }
              ]
            ],
            behaviors: [
              {
                type: 'add_response_header',
                attributes: {
                  value: 'x-azion-debug: 01'
                }
              }
            ]
          },
          {
            name: 'CORS Header',
            description: 'Set header -- Access-Control-Allow-Origin: *',
            active: true,
            criteria: [
              [
                {
                  variable: '${uri}',
                  conditional: 'if',
                  operator: 'starts_with',
                  argument: '/'
                }
              ]
            ],
            behaviors: [
              {
                type: 'add_response_header',
                attributes: {
                  value: 'Access-Control-Allow-Origin: *'
                }
              }
            ]
          }
        ]
      }
    }
  ],
  workloads: [
    {
      name: 'azion-console-kit-storybook',
      active: true,
      infrastructure: 1,
      deployments: [
        {
          name: 'azion-console-kit-storybook',
          current: true,
          active: true,
          strategy: {
            type: 'default',
            attributes: {
              application: 'azion-console-kit-storybook'
            }
          }
        }
      ]
    }
  ]
})