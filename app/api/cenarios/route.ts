import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// Safra padrão da aplicação. Parametrizável para suportar múltiplas safras
// no futuro (a UI pode enviar params.safra).
const SAFRA_PADRAO = "Soja 2026";

// Limite de cenários retornados (paginação simples — os mais recentes primeiro).
const LIMITE_CENARIOS = 100;

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const cenarios = await prisma.cenario.findMany({
      where: { userId: auth.userId },
      orderBy: { ts: "desc" },
      take: LIMITE_CENARIOS,
    });
    return NextResponse.json(
      cenarios.map((c) => ({
        id: c.id,
        nome: c.nome,
        ts: Number(c.ts),
        params: {
          produtividade: c.produtividade,
          precoDisp: c.precoDisp,
          precoFuturo: c.precoFuturo,
          barter: c.barter,
          arrendamento: c.arrendamento,
          taxaMensal: c.taxaMensal,
          dataHoje: c.dataHoje ? c.dataHoje.toISOString().slice(0, 10) : null,
          dataTravamento: c.dataTravamento
            ? c.dataTravamento.toISOString().slice(0, 10)
            : null,
          area: c.area,
        },
        resumo: {
          investimentoTotal: c.investimentoTotal,
          receita: c.receita,
          lucroOperacional: c.lucroOperacional,
          margem: c.margem,
          pontoEquilibrio: c.pontoEquilibrio,
          custoPorSaca: c.custoPorSaca,
          precoSaca: c.precoSaca,
          usaAlta: c.usaAlta,
          custoBarter: c.custoBarter,
          lucroTotalFazenda: c.lucroTotalFazenda,
          area: c.area,
        },
      }))
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao listar cenários" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { nome, params, resumo, safra: safraNome } = body as {
      nome: string;
      safra?: string;
      params: {
        produtividade: number;
        precoDisp: number;
        precoFuturo: number;
        barter: boolean;
        arrendamento: number;
        taxaMensal?: number;
        dataHoje?: string | null;
        dataTravamento?: string | null;
        area?: number;
      };
      resumo: {
        investimentoTotal: number;
        receita: number;
        lucroOperacional: number;
        margem: number;
        pontoEquilibrio: number;
        custoPorSaca: number;
        precoSaca: number;
        usaAlta: boolean;
        custoBarter?: number;
        lucroTotalFazenda?: number;
        area?: number;
      };
    };

    // Validação mínima do payload.
    if (!nome || !params || !resumo || typeof params.produtividade !== "number") {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }

    const safra = await prisma.safra.upsert({
      where: { nome: safraNome || SAFRA_PADRAO },
      update: {},
      create: { nome: safraNome || SAFRA_PADRAO },
    });

    const cenario = await prisma.cenario.create({
      data: {
        nome,
        safraId: safra.id,
        userId: auth.userId,
        ts: BigInt(Date.now()),
        produtividade: params.produtividade,
        precoDisp: params.precoDisp,
        precoFuturo: params.precoFuturo,
        barter: params.barter,
        arrendamento: params.arrendamento,
        taxaMensal: params.taxaMensal ?? 0.016,
        dataHoje: params.dataHoje ? new Date(params.dataHoje) : null,
        dataTravamento: params.dataTravamento ? new Date(params.dataTravamento) : null,
        area: params.area ?? 1,
        investimentoTotal: resumo.investimentoTotal,
        receita: resumo.receita,
        lucroOperacional: resumo.lucroOperacional,
        margem: resumo.margem,
        pontoEquilibrio: resumo.pontoEquilibrio,
        custoPorSaca: resumo.custoPorSaca,
        precoSaca: resumo.precoSaca,
        usaAlta: resumo.usaAlta,
        custoBarter: resumo.custoBarter ?? 0,
        lucroTotalFazenda: resumo.lucroTotalFazenda ?? 0,
      },
    });

    return NextResponse.json(
      {
        id: cenario.id,
        nome: cenario.nome,
        ts: Number(cenario.ts),
        params: {
          ...params,
          taxaMensal: cenario.taxaMensal,
          dataHoje: cenario.dataHoje ? cenario.dataHoje.toISOString().slice(0, 10) : null,
          dataTravamento: cenario.dataTravamento
            ? cenario.dataTravamento.toISOString().slice(0, 10)
            : null,
          area: cenario.area,
        },
        resumo: {
          ...resumo,
          custoBarter: cenario.custoBarter,
          lucroTotalFazenda: cenario.lucroTotalFazenda,
          area: cenario.area,
        },
      },
      { status: 201 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Erro ao salvar cenário" },
      { status: 500 }
    );
  }
}
