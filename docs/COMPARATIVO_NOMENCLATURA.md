# Comparativo: Convenções de Nomenclatura para Arquivos

> Qual padrão adotar para nomes de arquivos em projetos frontend?

---

## Opções em Análise

| | **kebab-case** | **PascalCase** |
|---|---|---|
| **Exemplo** | `list-domains-service.js` | `ListDomainsService.js` |
| **Padrão** | palavras-separadas-por-hifen | PalavrasJuntas |

---

## Comparativo Detalhado

| Critério | kebab-case | PascalCase | Vencedor |
|----------|------------|------------|----------|
| **Recomendação Vue.js** | Recomendado oficialmente | Aceito como alternativa | kebab-case |
| **Recomendação React** | Comum para arquivos | Comum para componentes | Empate |
| **Case-insensitive (Windows/macOS)** | Sem problemas | Pode causar conflitos | kebab-case |
| **Consistência com pastas** | Igual (pastas são kebab) | Diferente | kebab-case |
| **Consistência com CSS** | Igual | Diferente | kebab-case |
| **Autocomplete IDE** | Funciona bem | Funciona bem | Empate |
| **Git rename** | Sem problemas | Pode ter conflitos | kebab-case |
| **Legibilidade** | Alta | Alta | Empate |
| **URLs/rotas** | Já no formato correto | Precisa converter | kebab-case |
| **Padrão atual do projeto** | Já utilizado | Mudança necessária | kebab-case |

---

## Exemplos Práticos

### kebab-case (Recomendado)

```
src/services/
├── domains/
│   ├── list-domains-service.js
│   ├── create-domain-service.js
│   ├── domain-response-adapter.js
│   └── domain-request-adapter.js
├── edge-applications/
│   ├── list-edge-applications-service.js
│   └── edge-application-adapter.js
└── core/
    ├── http-client.js
    └── error-handler.js
```

### PascalCase (Alternativa)

```
src/services/
├── domains/
│   ├── ListDomainsService.js
│   ├── CreateDomainService.js
│   ├── DomainResponseAdapter.js
│   └── DomainRequestAdapter.js
├── edge-applications/
│   ├── ListEdgeApplicationsService.js
│   └── EdgeApplicationAdapter.js
└── core/
    ├── HttpClient.js
    └── ErrorHandler.js
```

---

## Problema com Case-Insensitive

```bash
# Cenário problemático com PascalCase no macOS/Windows:

# Dev 1 cria arquivo
git add ListDomainsService.js

# Dev 2 renomeia (case diferente)
git mv ListDomainsService.js ListDomainService.js  # Remove o 's'

# Git pode não detectar como mudança em sistemas case-insensitive
# Resultado: conflitos e arquivos "fantasma"
```

**Com kebab-case esse problema não existe.**

---

## Convenção Completa Recomendada

| Elemento | Convenção | Exemplo |
|----------|-----------|---------|
| **Pastas** | kebab-case | `edge-applications/` |
| **Arquivos** | kebab-case | `list-domains-service.js` |
| **Funções** | camelCase | `listDomainsService()` |
| **Classes/Adapters** | PascalCase | `DomainResponseAdapter` |
| **Constantes** | SCREAMING_SNAKE_CASE | `API_BASE_URL` |
| **Variáveis** | camelCase | `domainList` |

---

## O que Dizem os Style Guides

### Vue.js (Oficial)

> "Filenames of single-file components should either be always PascalCase or always **kebab-case**."
>
> "Mixed case filenames can sometimes create issues on **case-insensitive file systems**, which is why **kebab-case is also perfectly acceptable**."

### Google TypeScript Style Guide

> "File names must be all lowercase and may include underscores (_) or dashes (-)"

### Airbnb JavaScript Style Guide

> "Use camelCase when naming objects, functions, and instances. Use PascalCase only when naming constructors or classes."

---

## Recomendação Final

| Decisão | Escolha |
|---------|---------|
| **Padrão para arquivos** | **kebab-case** |
| **Motivo principal** | Evita problemas em sistemas case-insensitive, alinhado com Vue.js e padrão atual do projeto |

### Resumo Visual

```
✅ kebab-case  →  list-domains-service.js
❌ PascalCase  →  ListDomainsService.js
❌ camelCase   →  listDomainsService.js
❌ snake_case  →  list_domains_service.js
```

---

## Referências

- [Vue.js Style Guide](https://vuejs.org/style-guide/rules-strongly-recommended.html)
- [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)

---

*Documento para apresentação - Janeiro 2026*
