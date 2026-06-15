import { PrismaClient, Configuracao } from "@prisma/client";
import { INSUMOS_BAIXO_INIT, INSUMOS_ALTA_INIT, OPERACIONAL_INIT } from "../lib/dados-iniciais";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed...");

  // Idempotência: se já houver insumos, não recria nada (preserva edições e
  // evita duplicação a cada restart do container). Use SEED_FORCE=1 para forçar.
  const force = process.env.SEED_FORCE === "1";
  const jaPopulado = (await prisma.insumo.count()) > 0;
  if (jaPopulado && !force) {
    console.log("✓ Banco já populado — seed ignorado (use SEED_FORCE=1 para recriar).");
    return;
  }

  await prisma.safra.upsert({
    where: { nome: "Soja 2026" },
    update: {},
    create: { nome: "Soja 2026" },
  });
  console.log("✓ Safra 'Soja 2026' criada");

  await prisma.insumo.deleteMany();
  await prisma.insumo.createMany({
    data: INSUMOS_BAIXO_INIT.map((i) => ({
      ...i,
      configuracao: Configuracao.BAIXO_CUSTO,
    })),
  });
  await prisma.insumo.createMany({
    data: INSUMOS_ALTA_INIT.map((i) => ({
      ...i,
      configuracao: Configuracao.ALTA_PRODUTIVIDADE,
    })),
  });
  console.log(
    `✓ Insumos criados (${INSUMOS_BAIXO_INIT.length} baixo custo, ${INSUMOS_ALTA_INIT.length} alta produtividade)`
  );

  await prisma.custoOperacional.upsert({
    where: { configuracao: Configuracao.BAIXO_CUSTO },
    update: OPERACIONAL_INIT.baixo,
    create: { configuracao: Configuracao.BAIXO_CUSTO, ...OPERACIONAL_INIT.baixo },
  });
  await prisma.custoOperacional.upsert({
    where: { configuracao: Configuracao.ALTA_PRODUTIVIDADE },
    update: OPERACIONAL_INIT.alta,
    create: {
      configuracao: Configuracao.ALTA_PRODUTIVIDADE,
      ...OPERACIONAL_INIT.alta,
    },
  });
  console.log("✓ Custos operacionais criados");

  console.log("Seed concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
