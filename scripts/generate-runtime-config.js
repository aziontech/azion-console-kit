#!/usr/bin/env node
/* eslint-env node */

/**
 * Generates dist/config.json from environment variables.
 *
 * Usage (post-build, before deploy):
 *   node scripts/generate-runtime-config.js
 *
 * The SPA fetches /config.json at startup (src/helpers/runtime-config.js) so
 * the same immutable bundle can be promoted across environments
 * (stage → production) without rebuilding. The deploy pipeline is expected to
 * run this (or an equivalent injector) with the target environment's values.
 *
 * SECURITY: the object below is an explicit allowlist of PUBLIC client-side
 * values. Never spread process.env here, and never add build-time secrets
 * (VITE_SENTRY_AUTH_TOKEN) or local-dev credentials (VITE_PERSONAL_TOKEN,
 * VITE_DEBUG_*, VITE_APPCUES_API_KEY/SECRET) — anything written to
 * config.json ships to every browser.
 */

import { writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = join(__dirname, '..', 'dist')

const config = {
  environment: process.env.VITE_ENVIRONMENT,
  sentryDsn:
    process.env.VITE_SENTRY_DSN || process.env.VITE_PROD_SENTRY || process.env.VITE_STAGE_SENTRY,
  stripeToken: process.env.VITE_STRIPE_TOKEN,
  recaptchaSiteKey: process.env.VITE_RECAPTCHA_SITE_KEY,
  segmentToken: process.env.VITE_SEGMENT_TOKEN,
  ssoGithub: process.env.VITE_SSO_GITHUB,
  ssoGoogle: process.env.VITE_SSO_GOOGLE,
  ssoAzure: process.env.VITE_SSO_AZURE,
  ssoIdpScimE2e: process.env.VITE_SSO_IDP_SCIM_E2E,
  appcuesAccountId: process.env.VITE_APPCUES_ACCOUNT_ID,
  hubspotApiUrl: process.env.VITE_HUBSPOT_API_URL
}

Object.keys(config).forEach((key) => {
  if (config[key] === undefined) {
    delete config[key]
  }
})

if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true })
}

const outputPath = join(distDir, 'config.json')
writeFileSync(outputPath, JSON.stringify(config, null, 2) + '\n')

// eslint-disable-next-line no-console
console.log(`Runtime config written to ${outputPath} (keys: ${Object.keys(config).join(', ')})`)
