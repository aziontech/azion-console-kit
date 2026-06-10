# Purge API

> Endpoint para purgar conteúdo cacheado no edge por URL, cache key ou wildcard. Extraído de `openapi-schema.yml`.

## Sumário

- [Purge](#purge)

---

## Purge

### `POST /workspace/api/purge/{purge_type}`

Cria uma nova requisição de purga (purge request) na sua conta. O purge invalida o conteúdo armazenado em cache no edge, forçando que a próxima requisição busque o conteúdo atualizado a partir da origem (ou da camada superior do cache, conforme o `layer` informado).

A operação aceita até um lote de itens (`items`) e é processada de forma assíncrona pela plataforma. A resposta confirma o recebimento e o estado da requisição.

**Autenticação:** `TokenAuth` ou `BearerAuth`.

**Tags:** `Purge`

**Operation ID:** `create_purge_request`

#### Path params

- `purge_type` (string, obrigatório): tipo de purga a ser executada. Valores aceitos:
  - `url`: invalida URLs completas no cache. Cada item deve ser uma URL completa (esquema, host e path).
  - `cachekey`: invalida entradas a partir da cache key gerada pelo edge. A cache key pode incluir variações (cookies, query strings, headers) usando o separador `@@`.
  - `wildcard`: invalida múltiplas entradas usando o caractere `*` como coringa. Apenas um item wildcard é permitido por requisição.

#### Request body

Schema: `PurgeRequest`

| Campo   | Tipo                 | Obrigatório | Default | Descrição                                                                  |
|---------|----------------------|-------------|---------|----------------------------------------------------------------------------|
| `items` | `array<string>` (URI) | Sim         | -       | Lista de itens a purgar. Cada item deve ter `minLength: 1`. `minItems: 1`. |
| `layer` | `string` (enum)      | Não         | `cache` | Camada de cache a purgar. Valores: `cache`, `tiered_cache`.                |

##### Exemplo: `purge_type = url`

```json
{
  "items": [
    "https://www.example.com/",
    "https://www.example.com/path/to/page",
    "https://www.example.com/assets/styles.css"
  ],
  "layer": "cache"
}
```

##### Exemplo: `purge_type = cachekey`

```json
{
  "items": [
    "https://www.example.com/path/to/page/@@cookie_name=value",
    "https://www.example.com/api/users/@@device=mobile",
    "https://www.example.com/products?id=123/@@country=BR"
  ],
  "layer": "tiered_cache"
}
```

##### Exemplo: `purge_type = wildcard`

```json
{
  "items": [
    "https://www.example.com/images/*"
  ],
  "layer": "cache"
}
```

#### Responses

##### `201 Created` - Purge request criado com sucesso

Schema: `PurgeResponse`

| Campo        | Tipo            | Descrição                                            |
|--------------|-----------------|------------------------------------------------------|
| `state`      | `string`        | Estado da requisição. Default: `executed`.           |
| `data`       | `Purge`         | Dados da purga aceita pela plataforma (obrigatório). |
| `data.items` | `array<string>` | Itens efetivamente enfileirados para purga.          |
| `data.layer` | `string` (enum) | Camada de cache alvo (`cache` ou `tiered_cache`).    |

```json
{
  "state": "executed",
  "data": {
    "items": [
      "https://www.example.com/",
      "https://www.example.com/path/to/page",
      "https://www.example.com/assets/styles.css"
    ],
    "layer": "cache"
  }
}
```

##### `400 Bad Request` - Validation Error

```json
{
  "errors": [
    {
      "status": "400",
      "code": "10000",
      "title": "Validation Error",
      "detail": "Invalid data provided in the request."
    }
  ]
}
```

##### `401 Unauthorized` - Authentication Failed

```json
{
  "errors": [
    {
      "status": "401",
      "code": "10001",
      "title": "Authentication Failed",
      "detail": "Invalid authentication credentials."
    }
  ]
}
```

##### `403 Forbidden` - Permission Denied

```json
{
  "errors": [
    {
      "status": "403",
      "code": "10003",
      "title": "Permission Denied",
      "detail": "You do not have permission to perform this action."
    }
  ]
}
```

##### `404 Not Found`

```json
{
  "errors": [
    {
      "status": "404",
      "code": "10004",
      "title": "Not Found",
      "detail": "Not found."
    }
  ]
}
```

##### `405 Method Not Allowed`

```json
{
  "errors": [
    {
      "status": "405",
      "code": "10007",
      "title": "Method Not Allowed",
      "detail": "Method \"{method}\" not allowed."
    }
  ]
}
```

##### `406 Not Acceptable`

```json
{
  "errors": [
    {
      "status": "406",
      "code": "10005",
      "title": "Not Acceptable",
      "detail": "Could not satisfy the request Accept header."
    }
  ]
}
```

##### `429 Too Many Requests` - Throttled

```json
{
  "errors": [
    {
      "status": "429",
      "code": "10010",
      "title": "Throttled",
      "detail": "Request was throttled."
    }
  ]
}
```
