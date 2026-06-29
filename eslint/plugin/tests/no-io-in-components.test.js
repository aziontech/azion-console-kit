const { RuleTester } = require('eslint')
const rule = require('../lib/rules/no-io-in-components')

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
})

ruleTester.run('no-io-in-components', rule, {
  valid: [
    // Component importing from a composable — allowed
    {
      code: `import { useReleaseImpact } from '../use-release-impact'`,
      filename: 'src/templates/release-composition/components/impact-panel.vue'
    },

    // Component importing vue — allowed
    {
      code: `import { ref, computed } from 'vue'`,
      filename: 'src/components/Foo/foo.vue'
    },

    // Component importing type/contract files — allowed (no runtime IO)
    {
      code: `import { ReleaseRow } from '../release.types'`,
      filename: 'src/components/Release/release-row.vue'
    },

    // axios import OUTSIDE a components/ dir — rule does not apply
    {
      code: `import axios from 'axios'`,
      filename: 'src/services/v2/release-impact/release-impact-lookup-service.js'
    },

    // *-service import in a composable (not under components/) — rule does not apply
    {
      code: `import { workloadService } from '../workload-service'`,
      filename: 'src/templates/release-composition/use-release-impact.js'
    },

    // s2s literal OUTSIDE a components/ dir — rule does not apply
    {
      code: `const QUERY = 'workloadsByDeployment'`,
      filename: 'src/services/v2/release-impact/release-impact-lookup-service.js'
    },

    // Innocuous string in a component — no violation
    {
      code: `const label = 'Review & deploy'`,
      filename: 'src/components/Release/release-row.vue'
    }
  ],

  invalid: [
    // Component importing axios — forbidden
    {
      code: `import axios from 'axios'`,
      filename: 'src/components/Release/release-row.vue',
      errors: [
        {
          messageId: 'noIoImport',
          data: { fileName: 'release-row.vue', source: 'axios' }
        }
      ]
    },

    // Component importing a *-service module — forbidden
    {
      code: `import { workloadService } from '../../services/v2/workloads/workload-service'`,
      filename: 'src/templates/release-composition/components/impact-panel.vue',
      errors: [
        {
          messageId: 'noIoImport',
          data: {
            fileName: 'impact-panel.vue',
            source: '../../services/v2/workloads/workload-service'
          }
        }
      ]
    },

    // Component referencing the s2s GraphQL query literal — forbidden
    {
      code: `const QUERY = 'workloadsByDeployment'`,
      filename: 'src/components/Release/impact-panel.vue',
      errors: [
        {
          messageId: 'noS2sLiteral',
          data: { fileName: 'impact-panel.vue', literal: 'workloadsByDeployment' }
        }
      ]
    },

    // Component referencing the s2s GraphQL endpoint path — forbidden
    {
      code: `const url = '/edge/api/graphql'`,
      filename: 'src/components/Release/impact-panel.vue',
      errors: [
        {
          messageId: 'noS2sLiteral',
          data: { fileName: 'impact-panel.vue', literal: 'edge/api/graphql' }
        }
      ]
    },

    // s2s literal inside a template string — forbidden
    {
      code: 'const url = `${base}/edge/api/graphql`',
      filename: 'src/components/Release/impact-panel.vue',
      errors: [{ messageId: 'noS2sLiteral' }]
    },

    // Multiple violations in one component file
    {
      code: `
        import axios from 'axios'
        import { svc } from '../client-service'
        const QUERY = 'workloadsByDeployment'
      `,
      filename: 'src/modules/release/components/blast-radius.vue',
      errors: [
        { messageId: 'noIoImport' },
        { messageId: 'noIoImport' },
        { messageId: 'noS2sLiteral' }
      ]
    }
  ]
})

console.log('no-io-in-components: all tests passed')
