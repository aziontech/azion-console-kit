# ADR-0001 — Azion Shell genérico (UI headless parametrizado por strategy)

- **Status:** Proposto — **recomendação: NÃO construir o shell genérico agora.** Fazer o fix de contrato (barato, reversível) e reabrir a questão só sob o _gate_ no fim deste documento.
- **Data:** 2026-06-26
- **Origem:** discussão de design durante o trabalho da tela full-page de New Release (analisado pelo `software-architect`).
- **Escopo:** frontend `azion-console-kit`.

---

## Contexto

Proposta: criar um **"Azion Shell"** — um casco de UI **headless** (header + toolbar/action-bar + slot de conteúdo) que não conhece domínio, parametrizado por uma **strategy injetada no instanciamento**. A strategy, a partir do **estado consumido**, devolveria header VM, lista de actions, badge e rotas. Duas estratégias hoje: **Default** (edição simples, sem versionamento) e **Versioning** (máquina de estados Draft→Building→Ready→Active, gestão de versões, rotas dedicadas, overlay de build, badge).

O **sintoma que motivou** a ideia é real e está confirmado no código:

- `src/templates/release-composition/version-options.js:10` redefine `DEPLOYABLE_STATES = ['ready','active']` à mão, duplicando o canônico `src/composables/versioning/to-version-options.js:5` (`[VERSION_STATES.READY, VERSION_STATES.ACTIVE]`). Drift por **não consumir o contrato**.
- `"Build & activate"` aparece hardcoded em ~7 pontos de render na trilha de release (`ReleaseComposerView.vue`, `deploy-drawer-block/index.vue`). Nenhum arquivo de `release-composition/` ou `views/Deployments/` importa `version-actions`/`metaFor`.

**Porém o sintoma é de não-consumo de CONTRATO, não de ausência de CASCO.** O repositório já tem **dois cascos compartilhados maduros**:

1. **Casco "default"** (~32 EditViews): `ContentBlock` (já provê o teleport `#action-bar`) + `PageHeadingBlock` (breadcrumb) + `EditFormBlock`/`action-bar-block`. Padrão canônico: `Domains/EditView.vue`.
2. **Casco "versioning"** (~9 famílias de recurso): `version-shell-block/` (`VersionShell`, `VersionEditorTabsShell`, `ResourceVersionLanding`), consumido por Applications, Firewall, WAF, Network Lists, Connectors, Custom Pages, Functions, Workload e Deployments. **Já é headless no eixo que importa**: recebe `useVersionQuery` (factory), `resourceType` (resolve capability), `adapter`, `tabs` — e a divergência por recurso é absorvida por `version-capability.js` (`deployable` vs `versioned-only`), **sem forkar**.

Ou seja: a abstração proposta **já existe duas vezes** — uma por caso, cada uma na forma certa para o seu caso. A pergunta real não é "devemos abstrair?", e sim "devemos **unificar os dois cascos sob um terceiro casco genérico por strategy**?".

---

## Decision drivers

1. Resolver o **drift real** (critério nº1).
2. **Reversibilidade** — preferir um fix de 1 PR a uma reescrita de 40+ telas.
3. **YAGNI / regra-de-três** — só abstrair com 3 consumidores reais e divergentes **do mesmo eixo de variação**.
4. **Interface mais estreita possível** — uma abstração que precisa de `if (strategy.hasX)` já vazou.
5. **Custo de migração vs payoff.**

---

## Alternativas consideradas

### Option A — Consumir o CONTRATO nas superfícies de release (fix barato) ✅

Não criar casco novo. (1) Re-exportar `DEPLOYABLE_STATES` do canônico em `version-options.js`; (2) decidir conscientemente sobre o label "Build & activate" (ver ressalva). **Custo: baixo. Reverter: baixo.** Mata o drift na origem com risco ~zero; reafirma o contrato como ponto de unificação.

### Option B — Construir o Azion Shell genérico por strategy (a proposta) ❌

Um casco headless único; Default/Versioning viram strategies; os 2 cascos atuais são reescritos. **Custo: alto. Reverter: alto.**

- **Generalização prematura:** as duas strategies são radicalmente assimétricas.
- **Interface vazada garantida:** cobrir `Versioning` exige hooks opcionais (`getOverlay?`, `getRoutes?`, `getBadge?`, `getCommandBus?`); `Default` retorna `null` em quase tudo.
- **Reescreve dois subsistemas estáveis** sem atender nenhuma dor existente. Não resolve o drift.

### Option C — Incremental, gated ✅ (postura de longo prazo)

Manter os dois cascos. Extrair o mínimo comum **só quando o 3º caso aparecer** e revelar o eixo de variação real. **Custo agora: zero.**

---

## Decisão

**Adotar Option A agora + Option C como postura. Recusar Option B no estado atual.**

Respostas diretas, ancoradas no código:

1. **Justifica agora? Não.** Há 2 cascos que **não variam no mesmo eixo** (um é ciclo de vida de artefato imutável; o outro é CRUD de formulário). Cada um já tem N consumidores felizes (32 e 9). Unificá-los não atende dor — atende elegância imaginada.
2. **Assimétricas demais? Sim, a ponto de vazar.** A interface estreita honesta (`{ heading, primaryActions, slot }`) **não aguenta** `Versioning` (overlay, badge, máquina de estados que gate-eia actions, dialog de comentário, command bus) sem passar a devolver _componentes_ e _slots arbitrários_ — aí o "shell genérico" virou um `<component :is>` com props opacas. Estreita o bastante p/ Default mutila Versioning; larga p/ Versioning vaza p/ Default.
3. **Release é instância ou consumidora? Consumidora — não cabe no molde.** `ReleaseComposerView.vue` é **grid de 2 colunas** (composição de N recursos + painel de impacto + footer com gate compósito), não header+toolbar+slot. O footer não é uma toolbar dirigida por `getVersionBarActions(state)`; é um botão único com gate `canBuildAndActivate`. Ela é consumidora do **contrato** (estados deployáveis, ato de Deploy), não instância do casco.
4. **Contrato vs casco — o que resolve o drift?** O **contrato**, e barato. O drift é "alguém escreveu uma string em vez de importar a constante". O casco genérico nem tocaria a tela que driftou (ela nunca seria instância dele).
5. **Migração vs payoff.** Barato agora (re-export + decisão de label). Caro e de payoff especulativo depois (reescrever 2 subsistemas p/ criar uma 3ª camada que vaza). Não há 3ª strategy concreta na mesa; a candidata óbvia (Release) já foi descartada.

---

## Ressalva crítica — "Build & activate" ≠ `metaFor('DEPLOY').label`

**Não deduplicar cegamente o label para `'Deploy'`.** A lógica de `deployCtx()` em `stores/release.js` mostra que "Build & activate" é um **ato compósito** (create + build + activate atômico), semanticamente distinto do `DEPLOY` do shell (que dispara o intent sobre uma versão **já** `ready`/`active`). Tratá-los como o mesmo label central faria o contrato _mentir_ sobre dois atos diferentes.

Decisão de **produto/semântica** (não de arquitetura):

- **(a)** na tela de New Release todos os recursos já são `ready` → não há build → o label vira **"Deploy"** como _cópia da tela_ (reflete o que de fato acontece), **ou**
- **(b)** "Build & activate" é um átomo próprio e ganha entrada dedicada em `ACTION_META` (ex.: `BUILD_AND_ACTIVATE`).

O drift de **estados** (`DEPLOYABLE_STATES`) é inequívoco e deve ser corrigido via contrato já; o **label** depende dessa decisão.

---

## Consequências

- **Positivas:** o drift real morre na origem com risco ~zero; o contrato (`version-machine`/`version-actions`/`version-capability`/`to-version-options`) fica reafirmado como a fronteira de unificação correta; os dois cascos estáveis ficam intocados.
- **Negativas:** o chrome continua "duplicado" em aparência — mas é duplicação de _natureza_, não de _implementação_; não é o DRY que a regra-de-três manda eliminar.
- **Neutras:** `version-shell-block` segue como o único casco "com strategy embutida" (via capability), suficiente para o eixo `deployable` vs `versioned-only`.

---

## Exit criteria — quando construir o Azion Shell genérico passaria a valer

Reabrir (e só então considerar Option B) se **TODAS** se materializarem:

1. **3º caso estruturalmente compatível** — precisa de chrome header+toolbar-de-estado+slot, e **não** é a Release (grid de 2 colunas está fora por construção).
2. **Eixo de variação convergente** — os 3 divergem só em _dados_ (qual header VM, quais actions, qual badge), não em _estrutura/componentes_ (overlay, dialogs, command bus).
3. **Dor medível** — ≥2 bugs/PRs de "header/toolbar driftou entre cascos" que o contrato compartilhado NÃO teria pego (drift de contrato não conta).
4. **Custo de não-unificar > custo de unificar** — manter 2 cascos passa a custar mais que reescrever + operar a camada de strategy.

Enquanto 1–4 não forem todas verdadeiras: **manter os dois cascos, evoluir o contrato.**

---

## Referências (código)

- Contrato (fronteira de unificação correta): `src/composables/versioning/version-actions.js`, `version-machine.js`, `version-capability.js`, `to-version-options.js`.
- Casco versioning (já com "strategy" via capability): `src/templates/version-shell-block/`.
- Casco default (~32 telas): `src/templates/content-block/index.vue`, `src/templates/page-heading-block/index.vue`, `src/templates/edit-form-block/no-header.vue`, `src/templates/action-bar-block/`.
- Drift a corrigir: `src/templates/release-composition/version-options.js:10`.
- Tela não-encaixável: `src/views/Deployments/v6/ReleaseComposerView.vue`, `src/stores/release.js`.

## Questão aberta (stakeholder de produto)

"Build & activate" é o mesmo átomo que "Deploy" ou um ato compósito próprio? Define se o label consome `metaFor('DEPLOY')` ou ganha um novo `ACTION_META.BUILD_AND_ACTIVATE`.
