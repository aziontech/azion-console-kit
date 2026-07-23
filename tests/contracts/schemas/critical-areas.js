/**
 * Contract-schema registry for the CRITICAL non-versioned areas (test-maturity
 * fase 2): money (payment, billing), authentication (MFA) and session identity
 * (account). Sibling of ./index.js — the versioned registry has a fixed
 * 4-key shape (versionResponse/draftRequest/...), so these live apart.
 */
import * as payment from './payment.schema'
import * as mfa from './mfa.schema'
import * as billingGql from './billing-gql.schema'
import * as account from './account.schema'

export const criticalAreaSchemas = { payment, mfa, billingGql, account }
export default criticalAreaSchemas
