# Lista de Servicos para Migracao

Servicos agrupados por dominio/URL da API.

---

## Agrupamento por Dominio

### Edge Applications
| URL Base | Servico Legado | Servico v2 | Status |
|----------|----------------|------------|--------|
| `/api/v3/edge_applications` | `edge-application-services/` | - | [ ] Migrar |
| `/api/v4/workspace/applications` | `edge-application-services/v4/` | `v2/edge-app/` | [ ] Unificar |

**Sub-recursos:**
- Cache Settings
- Device Groups
- Error Responses
- Rules Engine
- Origins
- Functions Instances

---

### Edge Functions
| URL Base | Servico Legado | Servico v2 | Status |
|----------|----------------|------------|--------|
| `/api/v3/edge_functions` | `edge-functions-services/` | - | [ ] Migrar |
| `/api/v4/workspace/functions` | `edge-functions-services/v4/` | `v2/edge-function/` | [ ] Unificar |

---

### Edge Firewall
| URL Base | Servico Legado | Servico v2 | Status |
|----------|----------------|------------|--------|
| `/api/v3/edge_firewall` | `edge-firewall-services/` | - | [ ] Migrar |
| `/api/v4/workspace/firewalls` | - | `v2/edge-firewall/` | [ ] Verificar |

**Sub-recursos:**
- Rules Engine
- WAF Rules
- Functions Instances
- Network List

---

### Domains
| URL Base | Servico Legado | Servico v2 | Status |
|----------|----------------|------------|--------|
| `/api/v3/domains` | `domains-services/` | - | [ ] Migrar |

---

### Edge DNS (Intelligent DNS)
| URL Base | Servico Legado | Servico v2 | Status |
|----------|----------------|------------|--------|
| `/api/v3/intelligent_dns` | `intelligent-dns-services/` | - | [ ] Migrar |
| `/api/v4/workspace/dns/zones` | - | `v2/edge-dns/` | [ ] Unificar |

**Sub-recursos:**
- Records
- DNSSEC

---

### WAF
| URL Base | Servico Legado | Servico v2 | Status |
|----------|----------------|------------|--------|
| `/api/v3/waf` | `waf-rules-services/` | - | [ ] Migrar |
| `/api/v4/workspace/wafs` | - | `v2/waf/` | [ ] Unificar |

---

### Digital Certificates
| URL Base | Servico Legado | Servico v2 | Status |
|----------|----------------|------------|--------|
| `/api/v3/digital_certificates` | `digital-certificates-services/` | - | [ ] Migrar |
| `/api/v4/workspace/tls/certificates` | - | `v2/digital-certificates/` | [ ] Unificar |

**Sub-recursos:**
- CSR (`/tls/csr`)
- CRLs (`/tls/crls`)

---

### Network Lists
| URL Base | Servico Legado | Servico v2 | Status |
|----------|----------------|------------|--------|
| `/api/v3/network_lists` | `network-lists-services/` | - | [ ] Migrar |
| `/api/v4/workspace/network_lists` | - | `v2/network-lists/` | [ ] Unificar |

---

### Variables
| URL Base | Servico Legado | Servico v2 | Status |
|----------|----------------|------------|--------|
| `/api/v3/variables` | `variables-services/` | - | [ ] Migrar |

---

### Edge Nodes & Services
| URL Base | Servico Legado | Servico v2 | Status |
|----------|----------------|------------|--------|
| `/api/v3/edge_nodes` | `edge-node-services/` | - | [ ] Migrar |
| `/api/v3/edge_services` | `edge-service-services/` | - | [ ] Migrar |

**Sub-recursos:**
- Edge Node Services
- Edge Service Resources

---

### Workloads
| URL Base | Servico Legado | Servico v2 | Status |
|----------|----------------|------------|--------|
| `/api/v4/workspace/workloads` | `workloads-services/` | `v2/workload/` | [ ] Unificar |
| `/api/v4/workspace/workloads/deployments` | `workload-deployment-service/` | - | [ ] Migrar |

---

### Data Stream
| URL Base | Servico Legado | Servico v2 | Status |
|----------|----------------|------------|--------|
| `/api/v3/data_streaming` | `data-streaming-services/` | - | [ ] Migrar |
| `/api/v4/workspace/stream/streams` | - | `v2/data-stream/` | [ ] Unificar |

---

### Edge Storage
| URL Base | Servico Legado | Servico v2 | Status |
|----------|----------------|------------|--------|
| `/api/v4/workspace/storage` | - | `v2/edge-storage/` | [ ] Verificar |

---

### Edge SQL
| URL Base | Servico Legado | Servico v2 | Status |
|----------|----------------|------------|--------|
| `/api/v4/workspace/sql/databases` | - | `v2/edge-sql/` | [ ] Verificar |

---

### Edge Connectors
| URL Base | Servico Legado | Servico v2 | Status |
|----------|----------------|------------|--------|
| `/api/v4/workspace/connectors` | - | `v2/edge-connectors/` | [ ] Verificar |

---

### Purge
| URL Base | Servico Legado | Servico v2 | Status |
|----------|----------------|------------|--------|
| `/api/purge` | `real-time-purge/` | - | [ ] Migrar |
| `/api/v4/workspace/purge` | - | `v2/purge/` | [ ] Unificar |

---

### Custom Pages
| URL Base | Servico Legado | Servico v2 | Status |
|----------|----------------|------------|--------|
| `/api/v4/workspace/custom_pages` | `custom-pages-services/` | `v2/custom-page/` | [ ] Unificar |

---

### IAM (Identity & Access Management)

#### Users
| URL Base | Servico Legado | Servico v2 | Status |
|----------|----------------|------------|--------|
| `/api/v4/iam/users` | `users-services/` | `v2/users/` | [ ] Unificar |

#### Teams & Permissions
| URL Base | Servico Legado | Servico v2 | Status |
|----------|----------------|------------|--------|
| `/api/v4/iam/teams` | `team-permission/` | - | [ ] Migrar |

#### Personal Tokens
| URL Base | Servico Legado | Servico v2 | Status |
|----------|----------------|------------|--------|
| `/api/v4/iam/personal_tokens` | `personal-tokens-services/` | - | [ ] Migrar |

#### Identity Providers
| URL Base | Servico Legado | Servico v2 | Status |
|----------|----------------|------------|--------|
| `/api/iam/identity_providers` | `identity-providers-services/` | - | [ ] Migrar |

#### Account Settings
| URL Base | Servico Legado | Servico v2 | Status |
|----------|----------------|------------|--------|
| `/api/v4/iam/account` | `account-settings-services/` | `v2/account/` | [ ] Unificar |

#### Accounts Management
| URL Base | Servico Legado | Servico v2 | Status |
|----------|----------------|------------|--------|
| `/api/iam/accounts` | `accounts-management-services/` | - | [ ] Migrar |

---

### Auth
| URL Base | Servico Legado | Servico v2 | Status |
|----------|----------------|------------|--------|
| `/api/token` | `auth-services/` | - | [ ] Migrar |
| `/api/auth` | `auth-services/` | - | [ ] Migrar |
| `/api/logout` | `auth-services/` | - | [ ] Migrar |

#### MFA
| URL Base | Servico Legado | Servico v2 | Status |
|----------|----------------|------------|--------|
| `/api/totp` | `mfa-services/` | - | [ ] Migrar |
| `/api/v4/auth/mfa/totp` | - | `v2/mfa/` | [ ] Unificar |

#### Signup
| URL Base | Servico Legado | Servico v2 | Status |
|----------|----------------|------------|--------|
| `/api/signup` | `signup-services/` | - | [ ] Migrar |

---

### Billing & Payments
| URL Base | Servico Legado | Servico v2 | Status |
|----------|----------------|------------|--------|
| `/api/v4/billing/graphql` | `billing-services/` | `v2/billing/` | [ ] Unificar |
| `/api/v4/billing/invoices` | `billing-services/` | `v2/billing/` | [ ] Unificar |
| `/api/v4/accounting/graphql` | `billing-services/` | - | [ ] Migrar |
| `/api/v4/payments` | `billing-services/` | `v2/payment/` | [ ] Unificar |

#### Contract
| URL Base | Servico Legado | Servico v2 | Status |
|----------|----------------|------------|--------|
| `/api/v3/contract` | `contract-services/` | - | [ ] Migrar |

---

### Observability

#### Real-time Metrics
| URL Base | Servico Legado | Servico v2 | Status |
|----------|----------------|------------|--------|
| `/api/v4/metrics/graphql` | `real-time-metrics-services/` | - | [ ] Migrar |

#### Real-time Events
| URL Base | Servico Legado | Servico v2 | Status |
|----------|----------------|------------|--------|
| `/api/v4/events/graphql` | `real-time-events-service/` | `v2/activity-history/` | [ ] Unificar |

---

### VCS (Version Control)
| URL Base | Servico Legado | Servico v2 | Status |
|----------|----------------|------------|--------|
| `/api/v4/vcs` | - | `v2/vcs/` | [ ] Verificar |

---

### Marketplace
| URL Base | Servico Legado | Servico v2 | Status |
|----------|----------------|------------|--------|
| `/api/marketplace` | `marketplace-services/` | `v2/marketplace/` | [ ] Unificar |

---

### Template Engine
| URL Base | Servico Legado | Servico v2 | Status |
|----------|----------------|------------|--------|
| `/api/template-engine` | `template-engine-services/` | - | [ ] Migrar |

---

### Script Runner
| URL Base | Servico Legado | Servico v2 | Status |
|----------|----------------|------------|--------|
| `/api/script-runner` | `script-runner-service/` | - | [ ] Migrar |

---

### External Integrations
| Servico | URL Externa | Status |
|---------|-------------|--------|
| GitHub | `api.github.com` | [ ] Manter separado |
| Status Page | `status.azion.com/api` | [ ] Manter separado |
| WebPageTest | `webpagetest.org/api` | [ ] Manter separado |
| Help Center | External | [ ] Manter separado |
| Feedback | External | [ ] Manter separado |

---

### UI Services
| Servico | Descricao | Status |
|---------|-----------|--------|
| `sidebar-menus-services/` | Menu data | [ ] Manter separado |
| `switch-account-services/` | Account switching | [ ] Migrar |
| `compare-with-azion/` | Comparison tool | [ ] Manter separado |

---

## Resumo por Acao

### Migrar (Legado -> v2)
Servicos que existem apenas no formato legado:
- Domains
- Variables
- Edge Nodes & Services
- Team Permission
- Personal Tokens
- Identity Providers
- Auth Services
- Signup Services
- Contract Services
- Template Engine
- Script Runner
- Real-time Metrics
- Accounts Management

### Unificar (Legado + v2)
Servicos que existem em ambos os formatos:
- Edge Applications
- Edge Functions
- Edge Firewall
- Edge DNS
- WAF
- Digital Certificates
- Network Lists
- Workloads
- Data Stream
- Custom Pages
- Users
- MFA
- Billing & Payments
- Marketplace
- Purge
- Activity History

### Verificar (Apenas v2)
Servicos que existem apenas em v2:
- Edge Storage
- Edge SQL
- Edge Connectors
- VCS

### Manter Separado
Servicos especiais ou integracoes externas:
- GitHub Integration
- Status Page
- WebPageTest
- Help Center
- Feedback
- Sidebar Menus
- Compare with Azion

---

**Ultima Atualizacao:** 2026-02-01
