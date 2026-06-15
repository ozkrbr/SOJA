# PROMPT DE ALTERAÇÃO — colar no Claude Code

> Use depois que o projeto já estiver scaffoldado. Estas são as **correções da
> planilha revisada** (`CUSTO_SOJA_2026_CORRIGIDA.xlsx`). A versão atualizada do
> protótipo (`CustoSoja.jsx`) já traz toda a lógica corrigida — use-a como
> referência. Cole os blocos um de cada vez.

---

## Contexto da correção (cole primeiro)

```
A planilha foi revisada e a lógica de cálculo mudou em dois pontos centrais.
O arquivo CustoSoja.jsx desta pasta já está atualizado com a lógica corrigida —
use a função `calcular` e o helper `mesesEntre` dele como fonte da verdade.
Antes de editar, leia o CustoSoja.jsx atualizado e me confirme que entendeu as
duas correções abaixo. Não altere os números esperados dos testes; se um teste
falhar, corrija o cálculo.

CORREÇÃO 1 — Custo financeiro do BARTER (juros compostos):
Quando barter = verdadeiro, além de usar o preço futuro como preço da saca, o
investimento total (insumos + operacional) sofre correção por JUROS COMPOSTOS
entre a data de hoje e a data de travamento:
  meses        = (dataTravamento − dataHoje) / 30      (em dias/30)
  custoBarter  = investimentoTotal × ((1 + taxaMensal)^meses − 1)
Parâmetros novos: taxaMensal (padrão 1,6% a.m. = 0.016), dataHoje, dataTravamento.
Quando barter = falso, custoBarter = 0.

CORREÇÃO 2 — ARRENDAMENTO entra no custo e usa o PREÇO DISPONÍVEL:
  custoArrend = arrendamento(sc/ha) × precoDisp
Atenção: usa SEMPRE o preço disponível (à vista), mesmo em cenário barter —
não o preço futuro.

Composição final do custo:
  custoTotal       = investimentoTotal + custoBarter + custoArrend
  lucroOperacional = receita − custoTotal
  (receita = produtividade × (barter ? precoFuturo : precoDisp))
```

## Passo A — Atualizar o módulo de cálculo e o teste

```
Atualize lib/calc.ts com as duas correções acima (função calcular + helper
mesesEntre). A função calcular passa a receber também: taxaMensal, dataHoje,
dataTravamento.

Substitua/adicione o teste de validação em lib/calc.test.ts pelo NOVO caso da
planilha corrigida:
  Entrada: produtividade=60, precoDisp=125, precoFuturo=108, barter=true,
           arrendamento=15, taxaMensal=0.016,
           dataHoje='2026-05-29', dataTravamento='2027-04-30',
           insumos/operacional nos valores de seed iniciais.
  Esperado (tolerância 0.01):
    meses        ≈ 11.2
    custoBarter  ≈ 887.96
    custoArrend  = 1875.00
    custoTotal   ≈ 7326.78
    receita      = 6480
    lucroOperacional ≈ -846.78
    margem       ≈ -0.1307
Mantenha também o teste antigo (barter=false, arrend=0) — ele continua válido:
investimentoTotal=4563.8221, receita=7500, lucro=2936.1779, margem≈0.3915.
Rode os testes e me mostre o resultado.
```

## Passo B — Banco: novos parâmetros do barter

```
Adicione ao modelo Cenario (Prisma) os campos do barter:
  taxaMensal      Float   @default(0.016)
  dataHoje        DateTime?
  dataTravamento  DateTime?
Crie uma migração. Esses parâmetros fazem parte do snapshot do cenário.
Se houver tabela de parâmetros globais/safra, considere guardar taxaMensal e a
data de travamento padrão lá também (a data de hoje pode ser sempre "agora").
```

## Passo C — UI

```
Atualize a UI conforme o CustoSoja.jsx atualizado:
1. Quando barter estiver ativo, exiba o painel "Condições do barter" com três
   campos: taxa mensal (% a.m.), data de hoje e data de travamento. Mostre ao
   lado o custo financeiro calculado e o número de meses.
2. No painel principal, adicione o KPI "Custo Total" mostrando a decomposição:
   investimento + barter + arrendamento.
3. Garanta que o gráfico de sensibilidade use os mesmos parâmetros de barter.
4. Inclua taxaMensal, dataHoje e dataTravamento no salvar/carregar de cenários.
```

## Passo D — Conferência e commit

```
Rode o app localmente e confira: com barter ON, prod 60, disp 125, fut 108,
arrend 15, taxa 1,6%, travamento 30/04/2027, o resultado deve dar lucro
≈ -R$ 846,78 e margem ≈ -13,07%.
Depois faça um commit descritivo: "fix: barter com juros compostos + arrendamento
sobre preço disponível (planilha revisada)" e push para o GitHub.
```

---

### Resumo do diff (para sua conferência)

| Item               | Antes (1ª planilha)              | Depois (corrigida)                                   |
|--------------------|----------------------------------|------------------------------------------------------|
| Barter             | só trocava o preço da saca       | + custo financeiro por juros compostos no período    |
| Taxa / datas       | não existiam                     | taxa mensal + data de hoje + data de travamento       |
| Arrendamento       | inerte (0) / preço da saca       | ativo: sc/ha × **preço disponível**                   |
| Custo total        | invest + arrend                  | invest + **barter** + arrend                          |
| Caso de validação  | lucro +2.936,18 (barter N)       | lucro **−846,78** (barter S, arrend 15)               |
