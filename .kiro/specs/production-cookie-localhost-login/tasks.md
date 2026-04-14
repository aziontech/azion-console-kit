# Plano de Implementação

- [x] 1. Escrever teste exploratório da condição do bug
  - **Property 1: Bug Condition** - Bypass do Guard e Skip do Logout com Debug Login
  - **CRITICAL**: Este teste DEVE FALHAR no código não corrigido — a falha confirma que o bug existe
  - **NÃO tente corrigir o teste ou o código quando ele falhar**
  - **NOTA**: Este teste codifica o comportamento esperado — ele validará a correção quando passar após a implementação
  - **OBJETIVO**: Encontrar contraexemplos que demonstrem a existência do bug
  - **Abordagem PBT com Escopo**: Para este bug determinístico, escopar a propriedade aos casos concretos de falha: `VITE_DEBUG_LOGIN='true'` com `hasSession=false`
  - Testar que `accountGuard` com `import.meta.env.VITE_DEBUG_LOGIN === 'true'`, `hasSession=false`, rota privada e sem `activeUserId` chama `accountStore.setHasSession(true)` e NÃO redireciona para `/login` (da Condição do Bug no design: `isBugCondition` onde `barrier1 = isDebugMode AND NOT hasSession AND isPrivateRoute AND NOT hasActiveUserId`)
  - Testar que `onMounted` do `LoginView` com `import.meta.env.VITE_DEBUG_LOGIN === 'true'` e `hasSession=false` NÃO chama `sessionManager.logout()` (da Condição do Bug no design: `barrier2 = isDebugMode AND isLoginView AND NOT hasSession`)
  - As asserções do teste devem corresponder às Propriedades de Comportamento Esperado do design (Properties 1 e 2)
  - Executar teste no código NÃO corrigido
  - **RESULTADO ESPERADO**: Teste FALHA (isso é correto — prova que o bug existe)
  - Documentar contraexemplos encontrados (ex: "accountGuard redireciona para '/login' mesmo com VITE_DEBUG_LOGIN='true'" e "LoginView executa logout() mesmo com VITE_DEBUG_LOGIN='true'")
  - Marcar tarefa como completa quando o teste estiver escrito, executado e a falha documentada
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Escrever testes de propriedade de preservação (ANTES de implementar a correção)
  - **Property 2: Preservation** - Comportamento Inalterado sem Debug Login
  - **IMPORTANTE**: Seguir a metodologia de observação primeiro
  - Observar: `accountGuard` com `VITE_DEBUG_LOGIN` não definido/false e `hasSession=false` redireciona para `/login` no código não corrigido
  - Observar: `accountGuard` com `hasSession=true` carrega dados da conta normalmente no código não corrigido, independente da flag
  - Observar: `onMounted` do `LoginView` com `VITE_DEBUG_LOGIN` não definido/false executa `sessionManager.logout()` no código não corrigido
  - Observar: `accountGuard` quando `loadUserAndAccountInfo()` falha redireciona para `/login` mesmo com `VITE_DEBUG_LOGIN=true` no código não corrigido
  - Escrever teste baseado em propriedades: para todas as entradas onde `VITE_DEBUG_LOGIN !== 'true'`, o guard redireciona para `/login` quando `hasSession=false` (dos Requisitos de Preservação no design — Properties 3 e 4)
  - Escrever teste baseado em propriedades: para todas as entradas onde `VITE_DEBUG_LOGIN !== 'true'`, o `onMounted` executa `sessionManager.logout()` (dos Requisitos de Preservação no design — Property 4)
  - Escrever teste baseado em propriedades: para todas as entradas onde `hasSession=true`, o fluxo de carregamento funciona igual independente da flag (dos Requisitos de Preservação no design — Property 3)
  - Escrever teste baseado em propriedades: quando `loadUserAndAccountInfo()` falha, o guard redireciona para `/login` mesmo com `VITE_DEBUG_LOGIN=true` (dos Requisitos de Preservação no design)
  - Verificar testes passam no código NÃO corrigido
  - **RESULTADO ESPERADO**: Testes PASSAM (confirma comportamento base a preservar)
  - Marcar tarefa como completa quando os testes estiverem escritos, executados e passando no código não corrigido
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3. Correção do bug de login localhost com cookies de produção

  - [x] 3.1 Implementar a correção no accountGuard.js
    - Em `src/router/hooks/guards/accountGuard.js`, dentro do bloco `if (!accountStore.hasSession)`, adicionar verificação `if (import.meta.env.VITE_DEBUG_LOGIN === 'true')` antes de redirecionar para `/login`
    - Quando a flag está ativa, chamar `accountStore.setHasSession(true)` ao invés de redirecionar
    - Permitir que o fluxo continue para o `try/catch` que chama `loadUserAndAccountInfo()`
    - _Bug_Condition: isBugCondition(input) onde barrier1 = isDebugMode AND NOT hasSession AND isPrivateRoute AND NOT hasActiveUserId_
    - _Expected_Behavior: accountGuard corrigido DEVE forçar setHasSession(true) e permitir continuação do fluxo para loadUserAndAccountInfo()_
    - _Preservation: Quando VITE_DEBUG_LOGIN !== 'true', o guard DEVE continuar redirecionando para /login quando hasSession=false_
    - _Requirements: 2.1, 2.3, 3.1, 3.3, 3.4_

  - [x] 3.2 Implementar a correção no LoginView.vue
    - Em `src/views/Login/LoginView.vue`, no `onMounted`, adicionar verificação `if (import.meta.env.VITE_DEBUG_LOGIN !== 'true')` antes de chamar `await sessionManager.logout()`
    - Quando a flag está ativa, pular a chamada `sessionManager.logout()`, preservando os cookies copiados
    - _Bug_Condition: isBugCondition(input) onde barrier2 = isDebugMode AND isLoginView AND NOT hasSession_
    - _Expected_Behavior: onMounted corrigido DEVE pular sessionManager.logout() quando VITE_DEBUG_LOGIN === 'true'_
    - _Preservation: Quando VITE_DEBUG_LOGIN !== 'true', o onMounted DEVE continuar executando sessionManager.logout()_
    - _Requirements: 2.2, 2.3, 3.2_

  - [x] 3.3 Verificar que o teste exploratório da condição do bug agora passa
    - **Property 1: Expected Behavior** - Bypass do Guard e Skip do Logout com Debug Login
    - **IMPORTANTE**: Re-executar o MESMO teste da tarefa 1 — NÃO escrever um novo teste
    - O teste da tarefa 1 codifica o comportamento esperado
    - Quando este teste passar, confirma que o comportamento esperado é satisfeito
    - Executar teste exploratório da condição do bug da tarefa 1
    - **RESULTADO ESPERADO**: Teste PASSA (confirma que o bug foi corrigido)
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.4 Verificar que os testes de preservação ainda passam
    - **Property 2: Preservation** - Comportamento Inalterado sem Debug Login
    - **IMPORTANTE**: Re-executar os MESMOS testes da tarefa 2 — NÃO escrever novos testes
    - Executar testes de propriedade de preservação da tarefa 2
    - **RESULTADO ESPERADO**: Testes PASSAM (confirma que não há regressões)
    - Confirmar que todos os testes ainda passam após a correção (sem regressões)

- [x] 4. Checkpoint - Garantir que todos os testes passam
  - Garantir que todos os testes passam, perguntar ao usuário se surgirem dúvidas.
