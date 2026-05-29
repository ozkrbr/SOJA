-- AlterTable: adiciona campos do barter corrigido ao snapshot de cenário
ALTER TABLE "Cenario" ADD COLUMN "taxaMensal"     DOUBLE PRECISION NOT NULL DEFAULT 0.016;
ALTER TABLE "Cenario" ADD COLUMN "dataHoje"       TIMESTAMP(3);
ALTER TABLE "Cenario" ADD COLUMN "dataTravamento" TIMESTAMP(3);
ALTER TABLE "Cenario" ADD COLUMN "custoBarter"    DOUBLE PRECISION NOT NULL DEFAULT 0;
