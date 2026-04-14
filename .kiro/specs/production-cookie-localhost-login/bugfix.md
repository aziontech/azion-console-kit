# Documento de Requisitos do Bugfix

## Introdução

O login local (localhost) usando cookies de produção copiados manualmente parou de funcionar. Anteriormente, bastava copiar os cookies de produção para o ambiente local e a sessão era mantida. Agora, o app depende tanto do cookie quanto do estado `hasSession` no Pinia (persistido no localStorage), criando duas barreiras que limpam a sessão antes que o usuário consiga acessar rotas privadas.

**Barreira 1 — `accountGuard.js`:** Quando o usuário não tem `hasSession` no store e tenta acessar uma rota privada, o guard redireciona para `/login` ao invés de tentar carregar os dados da conta com os cookies copiados.

**Barreira 2 — `LoginView.vue`:** No `onMounted`, o `sessionManager.logout()` é chamado incondicionalmente, o que limpa todos os dados do store (incluindo cookies/sessão), destruindo os cookies de produção copiados manualmente.

Ambas as correções devem ser condicionadas à flag existente `VITE_DEBUG_LOGIN=true` no `.env.local`, garantindo que o comportamento de produção não seja afetado.

## Análise do Bug

### Comportamento Atual (Defeito)

1.1 QUANDO `VITE_DEBUG_LOGIN=true` e o usuário copia cookies de produção para localhost e tenta acessar uma rota privada sem `hasSession` no Pinia, ENTÃO o sistema redireciona para `/login` ao invés de tentar carregar os dados da conta com os cookies copiados (em `accountGuard.js`)

1.2 QUANDO `VITE_DEBUG_LOGIN=true` e o usuário é redirecionado para (ou acessa) a tela de login com cookies de produção copiados, ENTÃO o sistema executa `sessionManager.logout()` no `onMounted`, limpando todos os dados do store e destruindo os cookies copiados (em `LoginView.vue`)

1.3 QUANDO `VITE_DEBUG_LOGIN=true` e o usuário copia cookies de produção para localhost, ENTÃO o sistema não consegue manter a sessão porque as duas barreiras (guard + logout no login) se combinam para impedir o fluxo de autenticação local

### Comportamento Esperado (Correto)

2.1 QUANDO `VITE_DEBUG_LOGIN=true` e o usuário copia cookies de produção para localhost e tenta acessar uma rota privada sem `hasSession` no Pinia, ENTÃO o sistema DEVE forçar `accountStore.setHasSession(true)` e permitir que o fluxo continue tentando carregar os dados da conta com os cookies copiados (em `accountGuard.js`)

2.2 QUANDO `VITE_DEBUG_LOGIN=true` e o usuário acessa a tela de login com cookies de produção copiados, ENTÃO o sistema DEVE pular a chamada `sessionManager.logout()` no `onMounted`, preservando os cookies copiados (em `LoginView.vue`)

2.3 QUANDO `VITE_DEBUG_LOGIN=true` e o usuário copia cookies de produção para localhost, ENTÃO o sistema DEVE confiar que os cookies são válidos e permitir o fluxo completo de autenticação local sem limpar a sessão

### Comportamento Inalterado (Prevenção de Regressão)

3.1 QUANDO `VITE_DEBUG_LOGIN` não está definido ou é `false` e o usuário tenta acessar uma rota privada sem `hasSession`, ENTÃO o sistema DEVE CONTINUAR A redirecionar para `/login` normalmente (em `accountGuard.js`)

3.2 QUANDO `VITE_DEBUG_LOGIN` não está definido ou é `false` e o usuário acessa a tela de login, ENTÃO o sistema DEVE CONTINUAR A executar `sessionManager.logout()` no `onMounted` para limpar dados de sessão anteriores (em `LoginView.vue`)

3.3 QUANDO o usuário está logado normalmente (com `hasSession=true` no Pinia) e tenta acessar uma rota privada, ENTÃO o sistema DEVE CONTINUAR A carregar os dados da conta e permitir o acesso normalmente, independente da flag `VITE_DEBUG_LOGIN`

3.4 QUANDO o carregamento dos dados da conta falha (mesmo com `VITE_DEBUG_LOGIN=true`), ENTÃO o sistema DEVE CONTINUAR A redirecionar para `/login` após o erro no `try/catch` do `accountGuard.js`
