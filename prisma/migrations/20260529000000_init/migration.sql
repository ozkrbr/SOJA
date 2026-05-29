-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Configuracao" AS ENUM ('BAIXO_CUSTO', 'ALTA_PRODUTIVIDADE');

-- CreateTable
CREATE TABLE "Insumo" (
    "id" SERIAL NOT NULL,
    "produto" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "familia" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "configuracao" "Configuracao" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Insumo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustoOperacional" (
    "id" SERIAL NOT NULL,
    "configuracao" "Configuracao" NOT NULL,
    "plantio" DOUBLE PRECISION NOT NULL,
    "colheita" DOUBLE PRECISION NOT NULL,
    "manutencao" DOUBLE PRECISION NOT NULL,
    "outros" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustoOperacional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Safra" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Safra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cenario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "safraId" INTEGER NOT NULL,
    "userId" TEXT,
    "ts" BIGINT NOT NULL,
    "produtividade" DOUBLE PRECISION NOT NULL,
    "precoDisp" DOUBLE PRECISION NOT NULL,
    "precoFuturo" DOUBLE PRECISION NOT NULL,
    "barter" BOOLEAN NOT NULL,
    "arrendamento" DOUBLE PRECISION NOT NULL,
    "investimentoTotal" DOUBLE PRECISION NOT NULL,
    "receita" DOUBLE PRECISION NOT NULL,
    "lucroOperacional" DOUBLE PRECISION NOT NULL,
    "margem" DOUBLE PRECISION NOT NULL,
    "pontoEquilibrio" DOUBLE PRECISION NOT NULL,
    "custoPorSaca" DOUBLE PRECISION NOT NULL,
    "precoSaca" DOUBLE PRECISION NOT NULL,
    "usaAlta" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cenario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustoOperacional_configuracao_key" ON "CustoOperacional"("configuracao");

-- CreateIndex
CREATE UNIQUE INDEX "Safra_nome_key" ON "Safra"("nome");

-- AddForeignKey
ALTER TABLE "Cenario" ADD CONSTRAINT "Cenario_safraId_fkey" FOREIGN KEY ("safraId") REFERENCES "Safra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
