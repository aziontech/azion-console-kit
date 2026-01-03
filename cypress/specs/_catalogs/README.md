# Test Specification Catalogs

This directory contains comprehensive test specification catalogs for all modules in the Azion Console.

## Structure

Each catalog follows the same structure:
1. Architecture Overview - Component hierarchy, templates, caching
2. API Endpoints - Base URLs, service methods, transformations
3. Toast Messages - Success/error messages
4. Validation Rules - Yup schemas, required fields
5. Data-TestIDs - All selectors for testing
6. Routes & Navigation - Routes, flows, URL params
7. Test Scenarios - Prioritized test cases

## Catalogs (17 modules)

### Core Products
- [edge-applications.md](./edge-applications.md) - Edge Applications management
- [edge-firewall.md](./edge-firewall.md) - Edge Firewall with functions/rules
- [edge-dns.md](./edge-dns.md) - DNS zones and records
- [domains.md](./domains.md) - Domain management with mTLS
- [waf-rules.md](./waf-rules.md) - WAF rules and tuning
- [edge-functions.md](./edge-functions.md) - Edge Functions with code editor

### Storage & Data
- [edge-storage.md](./edge-storage.md) - Object storage with credentials
- [data-stream.md](./data-stream.md) - Data streaming connectors
- [digital-certificates.md](./digital-certificates.md) - TLS certificates and CSR
- [network-lists.md](./network-lists.md) - Network lists (ASN, IP/CIDR, Countries)

### Observability
- [real-time-events.md](./real-time-events.md) - Event logs with 8 datasets
- [real-time-metrics.md](./real-time-metrics.md) - Metrics dashboards

### Account & Identity
- [users.md](./users.md) - User management
- [teams-permissions.md](./teams-permissions.md) - Team permissions with PickList
- [credentials.md](./credentials.md) - Storage credentials
- [variables.md](./variables.md) - Environment variables (secrets)

### Edge Functions (separate location)
- [../edge-functions/SPEC_CATALOG.md](../edge-functions/SPEC_CATALOG.md) - Original detailed catalog

## Usage

Use these catalogs to:
1. Understand module architecture before writing tests
2. Find correct data-testids for selectors
3. Identify test scenarios and priorities
4. Reference API endpoints and toast messages

## Quick Reference

| Module | API Base | Main TestID Pattern |
|--------|----------|---------------------|
| EdgeApplications | v4/workspace/applications | edge-application-* |
| EdgeFirewall | v4/workspace/firewalls | edge-firewall-* |
| EdgeDNS | v4/workspace/dns/zones | edge-dns-* |
| Domains | /domains | domains-form__* |
| WafRules | waf | waf-rules-* |
| EdgeFunctions | v4/workspace/functions | create_Function_button |
| EdgeStorage | v4/workspace/storage | edge-storage-form__* |
| DataStream | v4/workspace/stream | data-stream-form__* |
| Certificates | v4/workspace/tls | digital-certificate__* |
| NetworkLists | v4/workspace/network_lists | network-list-form__* |
| RealTimeEvents | v4/events/graphql | table-tab-panel-block |
| RealTimeMetrics | v4/metrics/graphql | real-time-metrics__* |
| Users | v4/iam/users | users-form__* |
| TeamsPermissions | v4/iam/teams | teams-permissions-form__* |
| Credentials | v4/workspace/storage/credentials | credential-form__* |
| Variables | v3/variables | variables-form__* |
