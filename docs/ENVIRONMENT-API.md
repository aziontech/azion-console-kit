Environment

# ============================================================

# Environment API — stage (save-and-build)

# base: https://environment-api-stage.azion.app/v4

# ============================================================

# Create → SAVE AND BUILD: já cria a v1 e builda (resposta state="queued").

# Retorna data.id (environment) e data.version_id (versão criada).

curl -s -X POST 'https://environment-api-stage.azion.app/v4/environments' \
 -H 'Authorization: Token <TOKEN>' \
 -H 'Content-Type: application/json' \
 -d '{"name":"my-environment","deployment_policy":"single_version"}'

# ------------------------------------------------------------

# Update — SAVE AND BUILD CONDICIONAL (PATCH e PUT).

# A mudança é comparada com a última versão READY e segue um de três caminhos:

#

# 1) Muda algum campo de build (protection, log_verbosity, robots_policy,

# branch_tracking) → cria uma NOVA versão e builda (state="queued",

# novo version_id, emite evento install).

# 2) Muda SOMENTE name e/ou description → aplicado in place (sem nova versão,

# sem build). Resposta 200, state permanece "ready", mesmo version_id.

# 3) Nada muda de fato → 200 no-op.

#

# deployment_policy é imutável: valor igual = no-op; valor diferente = 409.

# ------------------------------------------------------------

# Update — PATCH (parcial), campo de build → cria nova versão e builda (state="queued").

curl -s -X PATCH 'https://environment-api-stage.azion.app/v4/environments/<ID>' \
 -H 'Authorization: Token <TOKEN>' \
 -H 'Content-Type: application/json' \
 -d '{"robots_policy":"noindex"}'

# Update — PATCH (parcial), somente identidade (name/description) → in place,

# NÃO cria nova versão e NÃO builda (state permanece "ready", mesmo version_id).

curl -s -X PATCH 'https://environment-api-stage.azion.app/v4/environments/<ID>' \
 -H 'Authorization: Token <TOKEN>' \
 -H 'Content-Type: application/json' \
 -d '{"name":"my-environment-renamed"}'

# Update — PUT (full replacement) → SAVE AND BUILD CONDICIONAL (mesmas regras acima).

# O body deve conter TODOS os campos mutáveis; omitir qualquer um → 400.

# deployment_policy é imutável (opcional; se enviado diferente → 409).

# Se apenas name/description diferirem da versão READY atual, o PUT também é in place.

curl -s -X PUT 'https://environment-api-stage.azion.app/v4/environments/<ID>' \
 -H 'Authorization: Token <TOKEN>' \
 -H 'Content-Type: application/json' \
 -d '{
"name":"my-environment",
"description":null,
"log_verbosity":"normal",
"robots_policy":"index",
"protection":{},
"branch_tracking":null
}'

# ------------------------------------------------------------

# Campos configuráveis (body flat):

# name string 3–255 (obrigatório no create; identidade)

# description string | null (default null; identidade)

# deployment_policy single_version | versioned_urls (obrigatório no create; IMUTÁVEL)

# log_verbosity normal | verbose (default normal; build)

# robots_policy index | noindex (default index; build)

# protection objeto (4 sub-blocos; ver abaixo) (default tudo desabilitado; build)

# branch_tracking objeto | null (default null; build)

#

# protection (no PATCH cada sub-bloco é opcional e sofre merge; no PUT o objeto é completo):

# {

# "azion_authentication": { "enabled": false },

# "password_protection": { "enabled": false, "secret_id": null },

# "ip_allowlist": { "enabled": false, "cidrs": [] }, # IPs/CIDR IPv4 e IPv6

# "sso_enforcement": { "enabled": false, "idp_id": null, "allowed_domains": [] }

# }

#

# branch_tracking (ou null para desabilitar):

# { "enabled": true, "mode": "branch_starts_with", "branch_match": "release/" }

# mode ∈ branch_is | branch_starts_with | branch_ends_with

# ------------------------------------------------------------

# Get (resolve para a última versão READY) e List

curl -s 'https://environment-api-stage.azion.app/v4/environments/<ID>' \
 -H 'Authorization: Token <TOKEN>'
curl -s 'https://environment-api-stage.azion.app/v4/environments' \
 -H 'Authorization: Token <TOKEN>'

# Histórico de versões — SOMENTE LEITURA (list + get)

curl -s 'https://environment-api-stage.azion.app/v4/environments/<ID>/versions' \
 -H 'Authorization: Token <TOKEN>'
curl -s 'https://environment-api-stage.azion.app/v4/environments/<ID>/versions/<VERSION_ID>' \
 -H 'Authorization: Token <TOKEN>'

# Archive — nível base (assíncrono). reason é obrigatório

# (SUPERSEDED | SECURITY_ISSUE | POLICY_VIOLATION | MANUAL); comment é opcional.

curl -s -X POST 'https://environment-api-stage.azion.app/v4/environments/<ID>/archive' \
 -H 'Authorization: Token <TOKEN>' \
 -H 'Content-Type: application/json' \
 -d '{"reason":"MANUAL","comment":"archived"}'

# Delete — soft delete assíncrono

curl -s -X DELETE 'https://environment-api-stage.azion.app/v4/environments/<ID>' \
 -H 'Authorization: Token <TOKEN>'

# ============================================================

# NOTA DE FRONTEND — bypass de secret_id / idp_id (console-kit)

# ============================================================

# O formulário de Environment (src/views/Environments/FormFields) renderiza os campos

# protection.password_protection.secret_id e protection.sso_enforcement.idp_id, MAS o

# frontend NÃO os envia à API por enquanto (bypass em src/views/Environments/Config/adapters.js,

# buildProtectionContract). Motivo: ainda não há integração de escrita de secrets/IdP no console.

# Como o PATCH faz merge por sub-bloco, omitir esses campos PRESERVA qualquer valor já existente;

# no POST eles ficam null. Remover o bypass quando existir seletor de secrets/IdP.
