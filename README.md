# Azion Platform Kit

## Introdução

O Azion Platform Kit é um kit de desenvolvimento front-end composto pelas feito em Vue/Vite com framework PrimeVue e Tailwind que permite executar o RTM no ambiente de sua preferência.

## Getting Started

Iniciando a sua jornada em menos de 5 minutos.

Certifique-se de possuir a Node 18.\* ou superior no seu ambiente ou docker.

1. Para iniciar clone este repositório no seu ambiente local:

```cmd
  $ git clone git@github.com:aziontech/azion-platform-kit.git
  $ cd azion-platform-kit
```

2. Crie um personal token no ambiente de [Stage do Azion RTM](https://stage-manager.azion.com/iam/personal-tokens).

3. Crie um arquivo no raiz do projeto com o nome `.env.development` e atribua o token conforme a sintaxe abaixo:

```env
VITE_PERSONAL_TOKEN=<SEU_PERSONAL_TOKEN>
```

3. Inicie o projeto

```cmd
  $ yarn install
  $ yarn dev
```

O servidor com a sua aplicação rodando estará atendendo na porta `5173` (padrão das aplicações Vue/Vite)

- `http://localhost:5173` - acesse o endereço para navegar.

## Características

1. **Multi-tenancy:** Construa conforme a sua necessidade o seu Real Time Manager consumindo os endpoints da nossa API Pública: [Azion Public API](https://api.azion.com)
2. **UI Customizável:** configure tokens de temas ou os gere automaticamente via [Builder](https://designer.primevue.org/) em seu projeto dando o look and feel de acordo com a sua necessidade.
3. **Estrutura simples:** separação em camadas dos blocks, components e serviços de forma que sejá fácil construir uma nova rota em pouquíssimo tempo.

## O que é uma aplicação multi-tenant?

Applicações Multi-tenant servem multiplos clientes através de diferentes domínios & subdomínios customizados com uma codebase unificada.

## Vai desenvolver?

### Configuração recomendada da sua IDE

Caso você opte pelo VSCode sugere-se o uso dos seguintes Plugins de forma a manter e controlar o pattern de desenvolvimento aumentando a velocidade:

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

[Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

Outra sugestão é deixar habilitado o auto-save do VSCode configurado para aplicar as regras de formatação das definições do ESLint e Prettier.
Para isso crie uma pasta chamada `.vscode/settings.json` com a seguinte configuração:

```
{
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "editor.detectIndentation": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
  },
  "eslint.validate": [
    "javascript"
  ],
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "files.insertFinalNewline": true
}
```

<font color="#f3652b">Este arquivo não deve ser comitado para não afetar preferências de outros usuários na IDE</font>

## Development

A estrutura segue o seguinte padrão:

```
├── App.vue
├── assets
│   └── themes
├── router
│   ├── routes
│   │   ├── edge-application-routes
│   │   └── variables-routes
│   └── index.js
├── services
│   ├── axios
│   ├── edge-application-services
│   └── variables-services
├── stores
├── templates
│   ├── create-form-block
│   ├── footer-block
│   ├── list-table-block
│   ├── main-menu-block
│   └── shell-block
└── views
    └── EdgeApplications
        ├── ListView.vue
        └── CreateView.vue
    └── Variables
        ├── ListView.vue
        └── FormView.vue
```

Onde:
| Diretório | Descrição |
|----------|----------|
| assets | Arquivos estáticos do projeto (CSS, Imagens, etc) |
| router | Estrutura de rotas, onde `index.js` centraliza todas rotas |
| services | Serviços separados por operação do CRUD |
| stores | Dados que precisam ser compartilhados entre as UI's/rotas |
| templates | Blocos disponíveis para a construção do projeto, já programados para integração |
| views | Conjunto de pastas separados por módulos, contém cada UI necessária para cada operação do CRUDL. |

Abaixo você pode visualizar um diagrama da disposição destes arquivos e a forma que se interligam para implementar um módulo CRUDL de Variables:

![Diagrama de Arquitetura](./docs/architecture-diagram.png)

### How to: criando uma UI de listagem de Variables

Tomando como exemplo a rota de _Variables_, temos o seguinte fluxo para implementação para a **Listagem**:

1. Criação do Serviço
   - _src/services/variables-services_
     - _make-variables-base-url.js_: método getter da URL base da API de Variables.
     - _index.js_: interface de exposição dos métodos (Listar, Editar, Excluir, Inserir)
     - _list-variables-service.js_: camada para chamada da API (endpoint de Listagem) e tratamento de retorno do payload (normalização, adição de helper, etc)
2. Criação da View
   - _ListView.vue_: através da seleção de um dos blocos (nesse exemplo: _src/templates/list-table-block_) é realizada a implementação lógica mais detalhada se necessário.
3. Criação da Rota:
   - _src/router/index.js_: passagem junto da rota das properties de serviço que já foram implementadas para o componente.
4. Adição no Menu (opcional)
   - _src/main-menu-block_: configuração da rota, nome e ícone que serão mostrados no Sidemenu (se necessário).

## Extras

### Compilar e Minificar para produção

```sh
yarn build
```

### Executar testes unitários com [Vitest](https://vitest.dev/)

```sh
yarn test:unit
```

### Executar testes e2e com [Cypress](https://www.cypress.io/)

```sh
yarn test:e2e:dev
```

Esse comando executa os testes e2e em um servidor de desenvolvimento Vite.
Sendo muito mais rápido que um build para produção.

Embora ainda seja recomendado executar os testes no código buildado para produção com `test:e2e` antes de executar o deploy (ex.: ambientes de CI):

```sh
yarn build
yarn test:e2e
```

### Formatação com [ESLint](https://eslint.org/)

```sh
yarn lint
```

### Deploy manual (First deploy)

Para executar o deploy você pode utilizar o Azion CLI:

Azion CLI (>= 0.70.0):

```
yarn build

azioncli edge_applications init --name azion-platform-kit --type vue --mode deliver

azioncli edge_applications publish --debug

```

### Deploy com GitHub Workflow

Para usufruir do GitHub Workflow você precisa ter configurado dentro do seu repositório as seguintes SECRETS:

| SECRET             | Descrição                                                                        |
| ------------------ | -------------------------------------------------------------------------------- |
| PLATFORM_KIT_TOKEN | seu Personal token da Azion para ser utilizado no CLI durante o deploy.          |
| APPLICATION_ID     | ID da Edge Application criada anteriormente via first deploy.                    |
| FUNCTION_ID        | ID da Edge Function criada anteriormente via first deploy.                       |
| DOMAIN_ID          | ID do Domain vinculado a Edge Application criado anteriormente via first deploy. |

---

<font color=#f3652b>\* As informações sobre os ID's necessários para os SECRETS estarão disponíveis dentro do arquivo `azion/azion.json` após o first deploy.</font>

### Issues conhecidas na versão 0.7.0 da azioncli

Devido à incompatibilidades com o vite na versão atual da azioncli os problemas abaixo podem ocorrer:

- No fluxo de deploy, na primeira vez, a cli acaba não criando o diretório `.edge/statics` e retorna uma mensagem de erro no terminal. Para solucionar esse problema, execute:

```sh
  mkdir .edge/statics && cp -r dist/* .edge/statics
  azioncli edge_applications publish
```

- Já nos casos de edição da edge application, os estáticos gerados em `dist` não sobrescrevem os que estão em `.edge/statics`. Antes publicar a edge application pela cli, verifique se os arquivos em `dist` e `.edge/statics` possuem o mesmo nome/conteúdo. Para solucionar esse problema, execute:

```sh
  rm -rf .edge/statics/* && cp -r dist/* .edge/statics
  azioncli edge_applications publish
```

### Outros links

[vee-validate guide](https://vee-validate.logaretm.com/v4/guide/composition-api/getting-started/)
[yup with vee-valide guide](https://vee-validate.logaretm.com/v4/guide/composition-api/getting-started/#validating-with-yup)
