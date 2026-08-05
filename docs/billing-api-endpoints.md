# billing-api — Referência de Endpoints (visão do spec)
---

Novas definicoes: vamos do zero revisando cada fluxo do login a tela de billing e seus fluxo de assinatura de plano e upgrade, downgrade.
- Telas legadas seram acessadas apenas por contas do tipo regular.
- O usuario so cai na tela de onbording que é a tela que substitui o addtional data, quando é first login.
- Quando o first login false é necessario fazer um subscriptions/current para pegar as inforamcoes do plano e seta como informacoes do usuario, como por exemplo o plano que o usuario selecionou.
- não vamos mais usar os servicos de service_orders agora sometne os que listei abaixo para tela de billing nova.
- como comentei teremos 2 versões de billing, a com plans e a sem para contas regulares.


## 1. Superfícies

| Superfície | Prefixo | Auth |
|---|---|---|
| Público (customer-facing) | `/v4` | JWT / API key |


---

## Subscriptions — o direito operacional

**Subscription é a rota canônica de plano / account mode.** O signup cria uma Subscription **sem** ServiceOrder por padrão.

Endpoints `current` só são seguros quando o contexto resolve **exatamente uma** Subscription ativa.

| Método | Rota | Propósito |
|---|---|---|
| `GET` / `POST` | `/v4/account/subscriptions` (`?billing_account=&account=&plan=&account_mode=&status=`) | lista / cria Subscription de plano. Com pagamento → `incomplete` + `client_secret`; ativação via gateway + outbox para o IAM |
| `GET` | `/v4/account/subscriptions/current` | alias restrito: a Subscription ativa do contexto. Ambiguidade ⇒ **409**, exigindo filtros explícitos |
| `GET` | `/v4/account/subscriptions/{id}` | detalhe |
| `GET` | `/v4/account/subscriptions/{id}/versions` | histórico efetivo de termos / preço |
| `POST` | `/v4/account/subscriptions/{id}/change` | upgrade / downgrade (`plan`, `period`, `proration_behavior=create_prorations`) |
| `POST` | `/v4/account/subscriptions/{id}/change/preview` | preview de pro-rata |
| `POST` | `/v4/account/subscriptions/{id}/cancel` |  |
| `GET` / `DELETE` | `/v4/account/subscriptions/{id}/scheduled_changes[/{sc_id}]` | mudanças agendadas |


## Dinheiro — payment methods · invoices · payments · settlements · credits · alertas · limites

Regra de nomenclatura (ADR-14): na API pública, **`Payment` é a visão customer-facing de `Charge`**. **`Settlement`** é dinheiro efetivamente aplicado — pode aparecer no detalhe de invoice/payment para auditoria, mas o cliente nunca pode mutá-lo.

| Método | Rota | Propósito |
|---|---|---|
| `GET` | `/v4/account/payments/payment_methods` | lista |
| `GET` / `DELETE` | `/v4/account/payments/payment_methods/{pm_id}` | detalhe / remove |
| `PUT` / `PATCH` | `/v4/account/payments/payment_methods/{pm_id}` | define default |

### Invoices (fonte da verdade do que é devido)

| Método | Rota | Propósito |
|---|---|---|
| `GET` | `/v4/account/billing/invoices` (`?billing_account=&period=&status=`) | faturas |
| `GET` | `/v4/account/billing/invoices/{id}` (`?format=[json\|pdf]`) | detalhe / linhas