# Manual QA — Overview tab (Edge Applications & Edge Firewall)
#
# Como executar:
#  1. `yarn dev` na branch feat/versioning-overview-tab
#  2. Logar no console com uma conta que já tenha ao menos uma Edge Application
#     e um Edge Firewall com >= 1 versão. Idealmente com deployments ativos.
#  3. Percorrer cada cenário e marcar PASS/FAIL. Os data-testids citados são
#     estáveis — use o DevTools para localizar elementos quando o texto variar.

Feature: Aba Overview em recursos versionados
  Como usuário do console
  Quero ver rapidamente o estado ativo de um recurso versionado
  Para saber quais versões estão recebendo tráfego sem entrar em cada workload

  Background:
    Given estou logado no console
    And existe uma Edge Application com pelo menos duas versões e um deployment ativo
    And existe um Edge Firewall com pelo menos duas versões e um deployment ativo

  # ─────────────────────────────────────────────────────────────
  # Shell da landing (ordem e visibilidade das abas)
  # ─────────────────────────────────────────────────────────────

  Scenario: Ordem das abas na Edge Application
    When abro a Edge Application no console
    Then vejo, nessa ordem, as abas "Overview", "Versions", "Settings" e "Variables"
    And a aba "Overview" está ativa por padrão

  Scenario: Ordem das abas no Edge Firewall
    When abro o Edge Firewall no console
    Then vejo, nessa ordem, as abas "Overview", "Versions" e "Settings"
    And a aba "Overview" está ativa por padrão

  Scenario: Troca de aba não recarrega toda a landing
    Given estou na aba "Overview" de uma Edge Application
    When clico na aba "Versions"
    Then o cabeçalho da página (título + botão de deploy) permanece visível sem re-render completo
    And o teleport "version-lifecycle-action" continua funcionando na aba "Settings"

  # ─────────────────────────────────────────────────────────────
  # Live Deployments
  # ─────────────────────────────────────────────────────────────

  Scenario: Tabela Live Deployments mostra apenas versões com tráfego
    Given a Edge Application tem uma versão ACTIVE e outra CANDIDATE
    When abro a aba "Overview"
    Then a seção "Live Deployments" lista apenas a versão com traffic_role ACTIVE
    And cada linha exibe as colunas Version, Environment, Workload e Deployed
    And a coluna Version mostra o hash da versão e uma tag verde "Live"

  Scenario: Environment vem do nome do deployment
    Given existe um deployment chamado "prod-api" servindo a versão X
    When abro a aba "Overview"
    Then a linha da versão X mostra "prod-api" na coluna Environment

  Scenario: Workload aparece como travessão quando não resolvido
    Given nenhum resolver popula o workload (comportamento atual)
    When abro a aba "Overview"
    Then todas as linhas de Live Deployments mostram "—" na coluna Workload

  Scenario: Uma versão em múltiplos deployments produz múltiplas linhas
    Given a versão Y está ativa em dois deployments distintos
    When abro a aba "Overview"
    Then a tabela Live Deployments mostra duas linhas para a versão Y
    And cada linha tem um Environment diferente
    And nenhuma das duas linhas aparece na tabela "Version History" abaixo

  Scenario: Estado vazio quando nenhuma versão está em produção
    Given a Edge Application não tem deployment ativo
    When abro a aba "Overview"
    Then a seção "Live Deployments" mostra o título "No versions currently receiving traffic"
    And mostra a mensagem "When a version is promoted to a workload, it will appear here as a live deployment."

  Scenario: Live Deployments não tem toolbar de busca
    When abro a aba "Overview"
    Then a tabela "Live Deployments" não exibe campo de busca nem filtros
    And as linhas dessa tabela não exibem menu de ação (kebab)

  # ─────────────────────────────────────────────────────────────
  # Version History
  # ─────────────────────────────────────────────────────────────

  Scenario: Version History exclui as versões ativas
    Given a Edge Application tem 5 versões e 2 delas estão live
    When abro a aba "Overview"
    Then a tabela "Version History" lista as 3 versões restantes
    And nenhuma delas exibe a tag "Live"

  Scenario: Busca em Version History filtra apenas o histórico
    Given estou na aba "Overview" com pelo menos 3 versões no histórico
    When digito parte do label de uma versão no campo de busca
    Then apenas as linhas correspondentes aparecem na tabela "Version History"
    And a tabela "Live Deployments" permanece inalterada

  Scenario: Filtros e paginação em Version History
    Given a Version History tem mais de 20 versões
    When abro a aba "Overview"
    Then o paginador aparece rodando 20 por página
    And o filtro de status funciona apenas no histórico
    And o botão de refresh reexecuta a query de versões

  Scenario: Estado vazio filtrado em Version History
    Given há versões no histórico
    When digito um termo de busca sem correspondência
    Then vejo "No versions match your filters" com sugestão para tentar outro termo

  # ─────────────────────────────────────────────────────────────
  # Ações via menu de linha (kebab)
  # ─────────────────────────────────────────────────────────────

  Scenario: Promote de uma versão do histórico
    Given estou na aba "Overview" com pelo menos uma versão inativa
    When abro o menu da linha e clico em "Promote"
    Then sou levado ao release composer com a versão pré-selecionada
    And ao voltar, a landing continua na aba "Overview"

  Scenario: Deploy da versão mais recente pela ação do heading
    Given estou na aba "Overview"
    When clico no botão de deploy no cabeçalho
    Then o Deploy Drawer abre pré-configurado para essa Edge Application

  # ─────────────────────────────────────────────────────────────
  # Loading / erro
  # ─────────────────────────────────────────────────────────────

  Scenario: Loading spinner enquanto a query de versões carrega
    When abro a landing pela primeira vez com a rede lenta
    Then vejo o spinner central com data-testid "*__loading"
    And as tabelas só aparecem depois que a query completa

  Scenario: Mensagem de erro se a query falhar
    Given a API de versões retorna 500
    When abro a aba "Overview"
    Then vejo InlineMessage vermelho com "Failed to load. Try refreshing the page."

  # ─────────────────────────────────────────────────────────────
  # Design system (checar visualmente)
  # ─────────────────────────────────────────────────────────────

  Scenario: Tipografia e espaçamentos respeitam o design system
    When comparo a aba "Overview" com o Figma
    Then títulos das seções usam text-body-md font-semibold
    And subtítulos usam text-body-sm text-color-secondary
    And o gap entre seções segue --spacing-6
    And nenhum hex/rgb aparece nas classes do bloco

  Scenario: Modo escuro
    When alterno para o tema escuro
    Then as tabelas, tags e headers da aba "Overview" mantêm contraste adequado
    And a tag "Live" (severity success) permanece legível
