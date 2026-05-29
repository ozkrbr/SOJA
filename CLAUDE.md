# CLAUDE.md — Projeto Custo de Produção Soja 2026

> Arquivo de contexto para o Claude Code. Descreve o objetivo, a stack, o modelo
> de dados e — o mais importante — as **fórmulas de cálculo já validadas** contra
> a planilha original `CUSTO_SOJA_2026.xlsx`. Não reinventar a lógica de cálculo:
> ela bate célula a célula com a planilha e deve ser preservada.

---

## 1. O que é

Aplicação web interna da **Terrena Agronegócios** para simular custos e
rentabilidade da produção de soja por hectare. Substitui uma planilha Excel
(`CUSTO_SOJA_2026.xlsx`) por um app multiusuário com:

- Parâmetros editáveis de simulação (produtividade, preços, barter, arrendamento)
- Duas configurações de insumos (Baixo Custo / Alta Produtividade), editáveis
- Custos operacionais editáveis
- Cálculo em tempo real (receita, investimento, lucro, margem, ponto de equilíbrio, custo/saca)
- Cenários salvos por safra
- Gráficos (composição de custo por família, sensibilidade à produtividade)

Já existe um **protótipo React single-file** na raiz do projeto:
`CustoSoja.jsx`. Ele contém a UI completa e o módulo de cálculo. O trabalho do
Claude Code é portar isso para um projeto Next.js full-stack com persistência
real em Postgres, mantendo a lógica idêntica.

## 2. Público e ambiente

- Uso interno, equipe Terrena (poucos usuários).
- Web. Sem necessidade de app mobile no MVP.
- Login via Microsoft 365 (a equipe já usa contas corporativas M365).

## 3. Stack alvo

| Camada     | Escolha                                              |
|------------|------------------------------------------------------|
| Framework  | Next.js (App Router) + TypeScript                    |
| UI         | React + TailwindCSS + Recharts (gráficos)            |
| Banco      | PostgreSQL                                           |
| ORM        | Prisma                                               |
| Auth       | Auth.js (NextAuth) com provider Microsoft Entra ID   |
| Deploy     | Docker (servidor interno) ou Vercel + Neon no início |

**Princípio central:** a lógica de cálculo deve ser um **módulo puro de funções
TypeScript** (`lib/calc.ts`), isolado da UI e do banco, com testes unitários.
As fórmulas são encadeadas; se espalhadas pela UI, qualquer mudança vira bug
silencioso.

## 4. Modelo de dados (Prisma)

Esboço a refinar. Entidades principais:

- **Familia** — categoria de insumo (FUNGICIDA, INSETICIDA, BIOLÓGICO, FOLIAR,
  HERBICIDA, FERTILIZANTE, SEMENTE, OLEO MINERAL, ADJUVANTE, FRETE).
- **Insumo** — produto, quantidade, valor unitário (R$), familia, e a qual
  configuração pertence (BAIXO_CUSTO | ALTA_PRODUTIVIDADE).
- **CustoOperacional** — plantio, colheita, manutenção, outros; por configuração.
- **Safra** — ano/identificação (ex.: "Soja 2026"), agrupa cenários.
- **Cenario** — snapshot de parâmetros + resultados calculados, pertence a uma Safra e a um User.
- **User** — autenticação M365 (gerenciado pelo Auth.js).

Sugestão de enum:
```prisma
enum Configuracao { BAIXO_CUSTO ALTA_PRODUTIVIDADE }
```

O `Cenario` deve guardar os **parâmetros de entrada** (produtividade, precoDisp,
precoFuturo, barter, arrendamento) e um **resumo dos resultados** (para listar
sem recalcular). O formato do objeto de cenário já usado no protótipo é:

```ts
{
  id, nome, ts,
  params: { produtividade, precoDisp, precoFuturo, barter, arrendamento },
  resumo: {
    investimentoTotal, receita, lucroOperacional, margem,
    pontoEquilibrio, custoPorSaca, precoSaca, usaAlta
  }
}
```

## 5. FÓRMULAS DE CÁLCULO (validadas — não alterar a lógica)

Replicam fielmente as abas `PRODUÇÃO SOJA` e `Planilha3` da planilha.
Conferidas contra os valores reais: subtotais, investimento total, lucro,
margem, ponto de equilíbrio e custo por saca batem exatamente.

### Constantes
- `BASE = 60` (produtividade base em sc/ha).

### Seleção de configuração
- Se `produtividade > BASE` → usa configuração **ALTA_PRODUTIVIDADE**.
- Senão → usa **BAIXO_CUSTO**.
- (Réplica de `IF(G3>60, ...)` da planilha.)

### Subtotal de insumos
```
subtotalInsumos(lista) = Σ ( quantidade_i × valor_i )
```
Valores de referência validados:
- Baixo Custo: **R$ 3.263,8221**
- Alta Produtividade: **R$ 4.417,2365**

### Custo operacional (soma dos 4 itens da config ativa)
```
opVal = plantio + colheita + manutencao + outros
```
- Baixo Custo: 350 + 250 + 400 + 300 = **1.300**
- Alta Produtividade: 350 + 350 + 400 + 300 = **1.400**

### Investimento total
```
investimentoTotal = insumos + opVal
```

### Preço da saca
```
precoSaca = barter ? precoFuturo : precoDisp
```
- `precoDisp` = preço da commodity no dia (à vista).
- `precoFuturo` = preço de travamento em bolsa (futuro).
- (Réplica de `IF(M3="N", I3, K3)`.)

### Receita bruta
```
receita = produtividade × precoSaca
```

### Custo de arrendamento (entra no custo total)
```
custoArrend = arrendamento_em_sc_ha × precoSaca
```
(Arrendamento informado em sc/ha; convertido a R$ pelo preço da saca.)

### Custo total, lucro, margem
```
custoTotal        = investimentoTotal + custoArrend
lucroOperacional  = receita − custoTotal
margem            = lucroOperacional / receita
```

### Ponto de equilíbrio e custo por saca
```
pontoEquilibrio = custoTotal / precoSaca        (em sc/ha)
custoPorSaca    = custoTotal / produtividade    (em R$/sc)
```

### Caso de validação (deve bater exatamente)
Entrada: produtividade=60, precoDisp=125, precoFuturo=108, barter=N, arrendamento=0,
insumos/operacional nos valores iniciais.
- Investimento total = **4.563,8221**
- Receita bruta = **7.500**
- Lucro operacional = **2.936,1779**
- Margem = **0,3915** (39,15%)
- Ponto de equilíbrio = **36,5106 sc/ha**
- Custo por saca = **76,0637 R$/sc**

> **Escreva um teste unitário com esse caso.** Se ele não passar, a port da
> lógica está errada — não ajustar os números esperados, corrigir o cálculo.

## 6. Dados iniciais (seed)

As listas completas de insumos das duas configurações e os custos operacionais
estão no `CustoSoja.jsx` (constantes `INSUMOS_BAIXO_INIT`, `INSUMOS_ALTA_INIT`,
`OPERACIONAL_INIT`). Use-as como **seed** do banco (`prisma/seed.ts`).

Observações sobre a planilha original:
- Os fertilizantes da config Baixo Custo usavam uma fórmula `FV()` de correção,
  mas com parâmetros vazios → equivalem ao valor cheio. Usar valor nominal.
- A semente "TORMENTA" do Baixo Custo já está com o valor corrigido (13243.3).

## 7. Persistência: do protótipo para o real

No `CustoSoja.jsx`, cenários são salvos via `window.storage` (storage do
artifact). **Substituir** por chamadas a rotas de API Next.js:
- `POST /api/cenarios` — cria
- `GET /api/cenarios?safraId=...` — lista
- `DELETE /api/cenarios/:id` — remove

O formato do objeto de cenário já está pronto (seção 4); mapear direto para o
modelo Prisma.

## 8. Convenções

- Comunicação e UI em **português do Brasil**.
- Moeda formatada em BRL (`Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' })`).
- Sem inflar dependências: usar o que a stack já oferece.
- Commits pequenos e descritivos. Sincronizar com GitHub via `gh`.

## 9. Roadmap sugerido (ordem de execução)

1. Scaffold Next.js + TS + Tailwind + Prisma + Auth.js.
2. Schema Prisma (seção 4) + migração inicial + `seed.ts` com os dados da seção 6.
3. `lib/calc.ts` — portar a lógica da seção 5 + teste do caso de validação.
4. Portar a UI do `CustoSoja.jsx` para componentes Next (App Router).
5. Rotas de API de cenários + trocar `window.storage` por fetch.
6. Auth.js com Microsoft Entra ID.
7. Dockerfile + docker-compose (app + Postgres) OU configurar Vercel + Neon.
8. README com instruções de setup e deploy.
