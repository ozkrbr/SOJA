# PROMPT DE SCAFFOLDING — colar no Claude Code

> Como usar: abra a pasta do projeto no VS Code (com `CustoSoja.jsx` e
> `CLAUDE.md` dentro). No Claude Code, cole os blocos abaixo **um de cada vez**,
> conferindo o resultado antes de avançar. Não cole tudo de uma vez — o trabalho
> fica melhor em etapas revisáveis.

---

## Passo 0 — Contexto (cole primeiro)

```
Leia o arquivo CLAUDE.md e o CustoSoja.jsx desta pasta antes de começar.
O CLAUDE.md tem o objetivo do projeto, a stack alvo, o modelo de dados e as
fórmulas de cálculo já validadas contra a planilha original. O CustoSoja.jsx é
um protótipo React single-file com a UI completa e o módulo de cálculo, além das
listas de insumos iniciais. Vamos portar esse protótipo para um projeto Next.js
full-stack com Postgres, mantendo a lógica de cálculo IDÊNTICA.

Não inicie a implementação ainda. Primeiro, me apresente um plano em etapas e
confirme que entendeu as fórmulas da seção 5 do CLAUDE.md. Aguarde meu OK.
```

## Passo 1 — Scaffold do projeto

```
Crie o scaffold do projeto na pasta atual:
- Next.js (App Router) + TypeScript
- TailwindCSS
- Recharts
- Prisma + @prisma/client
- Auth.js (next-auth) com provider Microsoft Entra ID
- Vitest para testes unitários

Configure o tsconfig, o tailwind, e um .env.example com as variáveis
necessárias (DATABASE_URL, AUTH_MICROSOFT_ENTRA_ID_*, etc).
Rode git init. Não faça commit ainda. Me mostre a estrutura final.
```

## Passo 2 — Banco e seed

```
Implemente o schema Prisma conforme a seção 4 do CLAUDE.md (Familia, Insumo,
CustoOperacional, Safra, Cenario, e os modelos de User/auth do Auth.js).
Use o enum Configuracao { BAIXO_CUSTO, ALTA_PRODUTIVIDADE }.

Crie prisma/seed.ts populando insumos e custos operacionais com EXATAMENTE os
dados das constantes INSUMOS_BAIXO_INIT, INSUMOS_ALTA_INIT e OPERACIONAL_INIT do
CustoSoja.jsx, e crie uma Safra "Soja 2026" inicial.

Gere a migração inicial e rode o seed. Me mostre o schema antes de migrar.
```

## Passo 3 — Módulo de cálculo + teste (etapa crítica)

```
Crie lib/calc.ts portando a lógica de cálculo da seção 5 do CLAUDE.md
(é a mesma do CustoSoja.jsx). Funções puras, sem dependência de UI ou banco:
subtotalInsumos, somaOperacional, e calcular(params).

Crie lib/calc.test.ts com o CASO DE VALIDAÇÃO da seção 5:
produtividade=60, precoDisp=125, precoFuturo=108, barter=false, arrendamento=0,
dados iniciais. Os resultados esperados (investimentoTotal=4563.8221,
receita=7500, lucroOperacional=2936.1779, margem≈0.3915,
pontoEquilibrio≈36.5106, custoPorSaca≈76.0637) DEVEM passar.
Se não passarem, corrija o cálculo — nunca ajuste os números esperados.

Rode os testes e me mostre o resultado.
```

## Passo 4 — UI

```
Porte a UI do CustoSoja.jsx para o App Router, quebrando em componentes
(ParamCard, Kpi, TabelaInsumos, etc.) e usando Tailwind no lugar dos estilos
inline. Mantenha as 5 abas (Painel, Insumos, Operacional, Análise, Cenários),
os 5 parâmetros editáveis no topo e os gráficos Recharts.
Os dados de insumos/operacional devem vir do banco via Prisma (server
components ou rota de API), não mais hardcoded.
```

## Passo 5 — API de cenários

```
Implemente as rotas:
- POST   /api/cenarios          (cria, vinculado ao usuário logado e à safra)
- GET    /api/cenarios?safraId= (lista)
- DELETE /api/cenarios/:id      (remove)
Use o formato de objeto de cenário da seção 4 do CLAUDE.md.
No front, substitua as chamadas window.storage por fetch a essas rotas.
```

## Passo 6 — Autenticação

```
Configure o Auth.js com o provider Microsoft Entra ID para login com as contas
M365 da Terrena. Proteja as páginas e as rotas de API: só usuários autenticados
acessam. Documente no README quais variáveis de ambiente o admin do Entra ID
precisa fornecer (client id, secret, tenant id, redirect URI).
```

## Passo 7 — Deploy e GitHub

```
Crie um Dockerfile e um docker-compose.yml (app Next.js + Postgres) para rodar
no servidor interno, com instruções no README. Inclua também a alternativa
Vercel + Neon para começar rápido.

Depois, autentique o gh (me avise se precisar que eu rode `gh auth login`),
crie um repositório privado no GitHub para a Terrena e faça o push inicial com
um commit bem descrito.
```

---

### Dicas de uso

- Se algo divergir do esperado, peça ao Claude Code para **explicar antes de
  corrigir** — isso evita que ele "conserte" mudando a resposta esperada.
- O teste do Passo 3 é o seu guarda-corpo: enquanto ele passar, a matemática do
  app está fiel à planilha.
- Você pode pedir ao Claude Code para rodar o app localmente (`npm run dev`) ao
  fim de cada etapa de UI para conferir visualmente.
