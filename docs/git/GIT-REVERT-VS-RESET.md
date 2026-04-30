# Git Revert vs Reset - Lição Aprendida

## Comandos utilizados para reverter o DEPLOY-2026-04-28

### 1. Para encontrar o commit:
```bash
git log --oneline -20 --grep="DEPLOY-2026-04-28"
git log --oneline -30
git show ac02738e2 --format=fuller -q
```

### 2. Para criar o revert (abordagem correta):
```bash
# Mudar para a branch onde queremos criar o revert
git checkout main

# Criar uma nova branch para o revert
git checkout -b revert-deploy-2026-04-28

# Criar um commit que REVERTE o merge
git revert -m 1 ac02738e2 --no-edit

# Se houver conflito:
git rm .github/workflows/sync-main-to-dev.yml
git revert --continue --no-edit
```

### 3. Para push (após criar a branch de revert):
```bash
git push origin revert-deploy-2026-04-28
```

---

## Por que `git reset` NÃO funciona para criar PR

### O que você fez (Opção 1 - ERRADA para este caso):
```bash
git checkout rollback
git reset --hard ee7be1974
```

**Resultado:**
- Branch `rollback` voltou no tempo para `ee7be1974`
- `rollback` ficou **ATRÁS** de `main`
- Não há nada novo para comparar → **não dá para criar PR**

### O que eu fiz (Opção 2 - CORRETA):
```bash
git checkout main
git checkout -b revert-deploy-2026-04-28
git revert -m 1 ac02738e2
```

**Resultado:**
- Criei uma branch a partir de `main` (branch atualizada)
- Criei um **novo commit** que desfaz o merge
- Branch fica **À FRENTE** de `main`
- Pode criar PR normal

---

## Diferença crucial: `git reset` vs `git revert`

### `git reset` - MOVE o ponteiro:
```
main:       A → B → C → D (merge deploy)
rollback:   A → B → C → D
git reset --hard C
rollback:   A → B → C ← HEAD
```

- Move a branch **para trás**
- Não cria commit novo
- Branch fica atrás de main
- **Perigoso** em branches compartilhadas (perde histórico)

### `git revert` - CRIA novo commit:
```
main:       A → B → C → D (merge deploy)
revert:     A → B → C → D → E (revert D)
```

- Cria um **novo commit** que desfaz as mudanças
- Branch fica à frente de main
- Pode criar PR
- **Seguro** - mantém o histórico

---

## O parâmetro `-m 1` explicado

```bash
git revert -m 1 ac02738e2
```

- `-m 1` = "manter o primeiro pai" (main)
- **Necessário para reverter merge commits**
- Merge tem 2 pais: main e dev
- `-m 1` diz para manter o lado de main

### Merge commits têm 2 pais:

```
commit D (merge)
│
├─ Pai 1: commit C (main branch)
└─ Pai 2: commit X (dev branch)
```

- `-m 1` = manter o que veio de main
- `-m 2` = manter o que veio de dev

---

## Resumo dos conceitos

1. **`git reset`**
   - Move o ponteiro da branch
   - Perigoso em branches compartilhadas
   - Perde histórico
   - Use para desfazer commits locais não enviados

2. **`git revert`**
   - Cria commit que desfaz mudanças
   - Seguro, mantém histórico
   - Use para reverter commits já enviados/compartilhados

3. **PR precisa de branch à frente**
   - Com commits novos para comparar
   - Branch atrás de main = sem mudanças para mostrar

4. **Merge commits**
   - Precisam de `-m 1` ou `-m 2`
   - Para indicar qual lado manter durante o revert

---

## Comandos úteis adicionais

### Ver conflitos durante revert:
```bash
git status
```

### Abortar revert se der muito errado:
```bash
git revert --abort
```

### Ver histórico de branches:
```bash
git log --oneline --graph --all -15
git branch -vv
```

### Ver reflog (histórico de HEAD):
```bash
git reflog -10
```

---

## Fluxo de trabalho correto para reverter um deploy

1. **Identifique o commit** usando `git log --grep`
2. **Crie uma branch a partir de main** (ou dev)
3. **Use `git revert`** (não `git reset`)
4. **Resolva conflitos** se houver
5. **Push a branch** e crie PR
6. **Merge o PR** para reverter o deploy

---

## Quando usar cada comando

### Use `git reset` quando:
- Você fez commits locais que não enviou ainda
- Quer refazer o commit message
- Quer desfazer mudanças antes de compartilhar

### Use `git revert` quando:
- Commits já estão em branches compartilhadas
- Precisa criar PR para reverter
- Quer manter histórico de mudanças
- Está revertendo um merge commit

---

## Exemplo prático do problema encontrado

### Problema:
```bash
git checkout rollback
git reset --hard ee7be1974
# Tenta criar PR rollback → main
# Erro: "não há nada para comparar"
```

### Solução:
```bash
git checkout main
git checkout -b revert-deploy-2026-04-28
git revert -m 1 ac02738e2
# Agora pode criar PR: revert-deploy-2026-04-28 → main
```

---

## Dicas finais

1. **Sempre use `git revert` para branches compartilhadas**
2. **Sempre crie uma branch nova a partir do target (main/dev)**
3. **Merge commits requerem `-m 1` ou `-m 2`**
4. **Resolva conflitos com `git rm` ou `git add`, depois `git revert --continue`**
5. **Use `git log --graph --all` para visualizar branches**

---

**Lembre-se**: `reset` move o ponteiro, `revert` cria novo commit. Para PRs, você precisa de commits novos à frente da branch target.