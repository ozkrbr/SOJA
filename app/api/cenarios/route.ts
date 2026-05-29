import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cenarios = await prisma.cenario.findMany({
      orderBy: { ts: "desc" },
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
        },
      }))
    );
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nome, params, resumo } = body as {
      nome: string;
      params: {
        produtividade: number;
        precoDisp: number;
        precoFuturo: number;
        barter: boolean;
        arrendamento: number;
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
      };
    };

    const safra = await prisma.safra.upsert({
      where: { nome: "Soja 2026" },
      update: {},
      create: { nome: "Soja 2026" },
    });

    const cenario = await prisma.cenario.create({
      data: {
        nome,
        safraId: safra.id,
        ts: BigInt(Date.now()),
        produtividade: params.produtividade,
        precoDisp: params.precoDisp,
        precoFuturo: params.precoFuturo,
        barter: params.barter,
        arrendamento: params.arrendamento,
        investimentoTotal: resumo.investimentoTotal,
        receita: resumo.receita,
        lucroOperacional: resumo.lucroOperacional,
        margem: resumo.margem,
        pontoEquilibrio: resumo.pontoEquilibrio,
        custoPorSaca: resumo.custoPorSaca,
        precoSaca: resumo.precoSaca,
        usaAlta: resumo.usaAlta,
      },
    });

    return NextResponse.json(
      {
        id: cenario.id,
        nome: cenario.nome,
        ts: Number(cenario.ts),
        params,
        resumo,
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
