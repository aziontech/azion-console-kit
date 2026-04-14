# Bugfix Design — Login Localhost com Cookies de Produção

## Visão Geral

O bug impede o login local (localhost) usando cookies de produção copiados manualmente quando `VITE_DEBUG_LOGIN=true`. Duas barreiras no fluxo de autenticação destroem a sessão antes que o usuário consiga acessar rotas privadas:

1. `accountGuard.js` redireciona para `/login` quando `hasSession` é `false`, sem tentar carregar os dados da conta com os cookies existentes.
2. `LoginView.vue` chama `sessionManager.logout()` incondicionalmente no `onMounted`, limpando os cookies copiados.

A correção adiciona verificações condicionadas à flag `VITE_DEBUG_LOGIN=true` (via `import.meta.env.VITE_DEBUG_LOGIN`) em ambos os arquivos, garantindo que o comportamento de produção permaneça inalterado.

## Glossário

- **Bug_Condition (C)**: A condição que dispara o bug — quando `VITE_DEBUG_LOGIN` é `'true'` e o usuário tenta usar cookies de produção copiados no localhost, mas o sistema bloqueia o fluxo por falta de `hasSession` ou por executar logout automático.
- **Property (P)**: O comportamento desejado — quando `VITE_DEBUG_LOGIN` é `'true'`, o guard deve forçar `hasSession=true` e o `LoginView` deve pular o `logout()`, permitindo que os cookies de produção sejam usados.
- **Preservation**: O comportamento existente que deve permanecer inalterado quando `VITE_DEBUG_LOGIN` não está definido ou é `false`.
- **accountGuard**: Função em `src/router/hooks/guards/accountGuard.js` que protege rotas privadas, verificando se o usuário tem sessão ativa e carregando dados da conta.
- **LoginView**: Componente Vue em `src/views/Login/LoginView.vue` que renderiza a tela de login e executa `sessionManager.logout()` no `onMounted`.
- **hasSession**: Estado booleano no store Pinia `account`, persistido no localStorage, que indica se o usuário tem uma sessão ativa.
- **VITE_DEBUG_LOGIN**: Flag de ambiente definida em `.env.local` que habilita o modo de debug de login para desenvolvimento local.

## Detalhes do Bug

### Condição do Bug

O bug se manifesta quando `VITE_DEBUG_LOGIN=true` e o usuário copia cookies de produção para o localhost. O `accountGuard.js` redireciona para `/login` porque `hasSession` é `false` no Pinia (não foi setado via fluxo normal de login). Em seguida, o `LoginView.vue` executa `sessionManager.logout()` no `onMounted`, destruindo os cookies copiados.

**Especificação Formal:**
```
FUNCTION isBugCondition(input)
  INPUT: input de tipo { debugLoginFlag: string | undefined, hasSession: boolean, isPrivateRoute: boolean, hasActiveUserId: boolean, isLoginView: boolean }
  OUTPUT: boolean

  LET isDebugMode = (input.debugLoginFlag === 'true')

  // Barreira 1: guard redireciona ao invés de forçar sessão
  LET barrier1 = isDebugMode
                  AND NOT input.hasSession
                  AND input.isPrivateRoute
                  AND NOT input.hasActiveUserId

  // Barreira 2: LoginView limpa cookies copiados
  LET barrier2 = isDebugMode
                  AND input.isLoginView
                  AND NOT input.hasSession

  RETURN barrier1 OR barrier2
END FUNCTION
```

### Exemplos

- **Exemplo 1 (Barreira 1):** Usuário define `VITE_DEBUG_LOGIN=true`, copia cookies de produção, acessa `localhost:5173/edge-applications`. O guard vê `hasSession=false`, redireciona para `/login` ao invés de forçar `hasSession=true` e tentar carregar a conta.
- **Exemplo 2 (Barreira 2):** Após o redirecionamento do Exemplo 1, o `LoginView` monta e executa `sessionManager.logout()`, destruindo os cookies de produção copiados.
- **Exemplo 3 (Combinação):** As duas barreiras se combinam: o guard redireciona para login, e o login limpa os cookies. O usuário fica preso num ciclo sem conseguir autenticar.
- **Exemplo 4 (Caso limite):** Usuário com `VITE_DEBUG_LOGIN=true` copia cookies inválidos/expirados. O guard força `hasSession=true`, mas `loadUserAndAccountInfo()` falha no `try/catch`, redirecionando para `/login` normalmente (comportamento correto).

## Comportamento Esperado

### Requisitos de Preservação

**Comportamentos Inalterados:**
- Quando `VITE_DEBUG_LOGIN` não está definido ou é `false`, o `accountGuard` DEVE continuar redirecionando para `/login` quando `hasSession` é `false`
- Quando `VITE_DEBUG_LOGIN` não está definido ou é `false`, o `LoginView` DEVE continuar executando `sessionManager.logout()` no `onMounted`
- Quando o usuário está logado normalmente (com `hasSession=true`), o fluxo de carregamento de dados da conta deve funcionar igual, independente da flag
- Quando `loadUserAndAccountInfo()` falha (mesmo com `VITE_DEBUG_LOGIN=true`), o guard DEVE continuar redirecionando para `/login` após o erro

**Escopo:**
Todas as situações onde `VITE_DEBUG_LOGIN` não é `'true'` devem ser completamente inalteradas pela correção. Isso inclui:
- Fluxo normal de login/logout em produção
- Redirecionamento do guard para rotas privadas sem sessão
- Limpeza de sessão no `onMounted` do `LoginView`
- Tratamento de erros no `try/catch` do guard

## Causa Raiz Hipotética

Com base na análise do bug, as causas raiz são:

1. **Guard sem bypass para debug:** O `accountGuard.js` verifica `!accountStore.hasSession` e redireciona imediatamente para `/login` sem considerar a flag `VITE_DEBUG_LOGIN`. Quando o usuário copia cookies de produção manualmente, o `hasSession` no Pinia permanece `false` porque não passou pelo fluxo normal de login. O guard deveria, quando `VITE_DEBUG_LOGIN=true`, forçar `accountStore.setHasSession(true)` e permitir que o fluxo continue para `loadUserAndAccountInfo()`.

2. **Logout incondicional no LoginView:** O `LoginView.vue` executa `await sessionManager.logout()` no `onMounted` sem verificar a flag `VITE_DEBUG_LOGIN`. Isso destrói qualquer cookie/sessão existente, incluindo os cookies de produção copiados manualmente. O `onMounted` deveria pular o `logout()` quando `VITE_DEBUG_LOGIN=true`.

## Propriedades de Corretude

Property 1: Bug Condition — Bypass do Guard com Debug Login

_Para qualquer_ entrada onde `VITE_DEBUG_LOGIN` é `'true'` e `hasSession` é `false` e a rota é privada e o usuário não tem `activeUserId`, a função `accountGuard` corrigida DEVE forçar `accountStore.setHasSession(true)` e permitir que o fluxo continue para `loadUserAndAccountInfo()`, ao invés de redirecionar para `/login`.

**Valida: Requisitos 2.1, 2.3**

Property 2: Bug Condition — Skip do Logout no LoginView com Debug Login

_Para qualquer_ entrada onde `VITE_DEBUG_LOGIN` é `'true'` e o `LoginView` é montado sem `hasSession`, a função `onMounted` corrigida DEVE pular a chamada `sessionManager.logout()`, preservando os cookies de produção copiados.

**Valida: Requisitos 2.2, 2.3**

Property 3: Preservation — Comportamento do Guard sem Debug Login

_Para qualquer_ entrada onde `VITE_DEBUG_LOGIN` NÃO é `'true'` (não definido ou `false`), a função `accountGuard` corrigida DEVE produzir exatamente o mesmo resultado que a função original, preservando o redirecionamento para `/login` quando `hasSession` é `false`.

**Valida: Requisitos 3.1, 3.3, 3.4**

Property 4: Preservation — Comportamento do LoginView sem Debug Login

_Para qualquer_ entrada onde `VITE_DEBUG_LOGIN` NÃO é `'true'` (não definido ou `false`), o `onMounted` do `LoginView` corrigido DEVE produzir exatamente o mesmo resultado que o original, executando `sessionManager.logout()` normalmente.

**Valida: Requisitos 3.2**

## Implementação da Correção

### Mudanças Necessárias

Assumindo que a análise de causa raiz está correta:

**Arquivo**: `src/router/hooks/guards/accountGuard.js`

**Função**: `accountGuard`

**Mudanças Específicas**:
1. **Adicionar verificação de `VITE_DEBUG_LOGIN`**: Dentro do bloco `if (!accountStore.hasSession)`, antes de redirecionar para `/login`, verificar se `import.meta.env.VITE_DEBUG_LOGIN === 'true'`.
2. **Forçar `hasSession` em modo debug**: Quando a flag está ativa, chamar `accountStore.setHasSession(true)` ao invés de redirecionar para `/login`.
3. **Permitir continuação do fluxo**: Após forçar `hasSession`, o fluxo deve continuar para o `try/catch` que chama `loadUserAndAccountInfo()`, permitindo que os cookies de produção sejam usados para carregar os dados da conta.

```javascript
if (!accountStore.hasSession) {
  if (import.meta.env.VITE_DEBUG_LOGIN === 'true') {
    accountStore.setHasSession(true)
  } else {
    setRedirectRoute(to)
    return '/login'
  }
}
```

---

**Arquivo**: `src/views/Login/LoginView.vue`

**Função**: `onMounted`

**Mudanças Específicas**:
1. **Adicionar verificação de `VITE_DEBUG_LOGIN`**: Antes de chamar `sessionManager.logout()`, verificar se `import.meta.env.VITE_DEBUG_LOGIN === 'true'`.
2. **Pular logout em modo debug**: Quando a flag está ativa, não executar `sessionManager.logout()`, preservando os cookies copiados.

```javascript
onMounted(async () => {
  if (useAccountStore().hasSession) {
    window.location.assign('/')
    return
  }

  if (import.meta.env.VITE_DEBUG_LOGIN !== 'true') {
    await sessionManager.logout()
  }

  const { email, activated } = route.query
  // ... resto do código inalterado
})
```

## Estratégia de Testes

### Abordagem de Validação

A estratégia de testes segue uma abordagem em duas fases: primeiro, encontrar contraexemplos que demonstrem o bug no código não corrigido, depois verificar que a correção funciona e preserva o comportamento existente.

### Verificação Exploratória da Condição do Bug

**Objetivo**: Encontrar contraexemplos que demonstrem o bug ANTES de implementar a correção. Confirmar ou refutar a análise de causa raiz. Se refutarmos, precisaremos re-hipotizar.

**Plano de Teste**: Escrever testes que simulem o fluxo do `accountGuard` e do `onMounted` do `LoginView` com `VITE_DEBUG_LOGIN=true` e `hasSession=false`. Executar no código NÃO corrigido para observar falhas.

**Casos de Teste**:
1. **Guard com Debug Login**: Simular `accountGuard` com `VITE_DEBUG_LOGIN=true`, `hasSession=false`, rota privada — deve redirecionar para `/login` no código não corrigido (vai falhar)
2. **LoginView com Debug Login**: Simular `onMounted` do `LoginView` com `VITE_DEBUG_LOGIN=true` — deve chamar `sessionManager.logout()` no código não corrigido (vai falhar)
3. **Fluxo Completo**: Simular o fluxo completo: guard redireciona → login limpa cookies (vai falhar no código não corrigido)

**Contraexemplos Esperados**:
- O guard redireciona para `/login` mesmo com `VITE_DEBUG_LOGIN=true`
- O `LoginView` executa `logout()` mesmo com `VITE_DEBUG_LOGIN=true`, destruindo cookies
- Causa provável: ausência de verificação da flag `VITE_DEBUG_LOGIN` em ambos os arquivos

### Verificação da Correção (Fix Checking)

**Objetivo**: Verificar que para todas as entradas onde a condição do bug é verdadeira, a função corrigida produz o comportamento esperado.

**Pseudocódigo:**
```
PARA TODA entrada ONDE isBugCondition(entrada) FAÇA
  resultado := accountGuard_corrigido(entrada)
  ASSERT setHasSession foi chamado com true
  ASSERT NÃO redirecionou para '/login'
  ASSERT loadUserAndAccountInfo foi chamado
FIM PARA

PARA TODA entrada ONDE isBugCondition(entrada) E isLoginView FAÇA
  resultado := onMounted_corrigido(entrada)
  ASSERT sessionManager.logout NÃO foi chamado
FIM PARA
```

### Verificação de Preservação (Preservation Checking)

**Objetivo**: Verificar que para todas as entradas onde a condição do bug NÃO é verdadeira, a função corrigida produz o mesmo resultado que a função original.

**Pseudocódigo:**
```
PARA TODA entrada ONDE NÃO isBugCondition(entrada) FAÇA
  ASSERT accountGuard_original(entrada) = accountGuard_corrigido(entrada)
  ASSERT onMounted_original(entrada) = onMounted_corrigido(entrada)
FIM PARA
```

**Abordagem de Teste**: Testes baseados em propriedades são recomendados para verificação de preservação porque:
- Geram muitos casos de teste automaticamente em todo o domínio de entrada
- Capturam casos limite que testes unitários manuais podem perder
- Fornecem garantias fortes de que o comportamento é inalterado para todas as entradas não-bugadas

**Plano de Teste**: Observar o comportamento no código NÃO corrigido primeiro para fluxos sem `VITE_DEBUG_LOGIN`, depois escrever testes baseados em propriedades capturando esse comportamento.

**Casos de Teste**:
1. **Preservação do Guard**: Verificar que sem `VITE_DEBUG_LOGIN=true`, o guard continua redirecionando para `/login` quando `hasSession=false`
2. **Preservação do LoginView**: Verificar que sem `VITE_DEBUG_LOGIN=true`, o `onMounted` continua executando `sessionManager.logout()`
3. **Preservação do Fluxo Normal**: Verificar que com `hasSession=true`, o fluxo de carregamento de dados funciona igual independente da flag
4. **Preservação do Tratamento de Erro**: Verificar que quando `loadUserAndAccountInfo()` falha, o guard redireciona para `/login` mesmo com `VITE_DEBUG_LOGIN=true`

### Testes Unitários

- Testar `accountGuard` com combinações de `VITE_DEBUG_LOGIN`, `hasSession`, `hasActiveUserId` e tipo de rota
- Testar `onMounted` do `LoginView` com e sem `VITE_DEBUG_LOGIN`
- Testar que `setHasSession(true)` é chamado corretamente no modo debug
- Testar caso limite: cookies inválidos com `VITE_DEBUG_LOGIN=true` (deve falhar no `try/catch` e redirecionar)

### Testes Baseados em Propriedades

- Gerar combinações aleatórias de `{ debugLoginFlag, hasSession, isPrivateRoute, hasActiveUserId }` e verificar que o guard se comporta corretamente
- Gerar estados aleatórios do store e verificar que o `LoginView` preserva o comportamento para entradas não-debug
- Testar que para qualquer entrada onde `VITE_DEBUG_LOGIN !== 'true'`, o comportamento é idêntico ao original

### Testes de Integração

- Testar o fluxo completo: copiar cookies → acessar rota privada → guard força sessão → dados carregados com sucesso
- Testar o fluxo de fallback: copiar cookies inválidos → guard força sessão → `loadUserAndAccountInfo` falha → redireciona para `/login`
- Testar que o fluxo normal de login (sem debug) continua funcionando end-to-end
