-- AlterTable: adiciona área de plantio e lucro total da fazenda ao snapshot de cenário
ALTER TABLE "Cenario" ADD COLUMN "area"              DOUBLE PRECISION NOT NULL DEFAULT 1;
ALTER TABLE "Cenario" ADD COLUMN "lucroTotalFazenda" DOUBLE PRECISION NOT NULL DEFAULT 0;
