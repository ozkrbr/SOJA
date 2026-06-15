import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    // deleteMany com filtro de userId: só remove se pertencer ao usuário.
    const { count } = await prisma.cenario.deleteMany({
      where: { id, userId: auth.userId },
    });
    if (count === 0) {
      return NextResponse.json(
        { error: "Cenário não encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Erro ao remover cenário" },
      { status: 500 }
    );
  }
}
