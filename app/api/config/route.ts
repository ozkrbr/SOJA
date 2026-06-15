import { NextResponse } from "next/server";

/**
 * Expõe os identificadores públicos do Entra ID em runtime, lendo do ambiente
 * do servidor. Assim a MESMA imagem Docker pode rodar em tenants diferentes
 * (dev/staging/prod) sem rebuild — não dependemos de NEXT_PUBLIC_* embutido no
 * bundle em build time.
 *
 * São identificadores públicos (clientId/tenantId), não segredos.
 */
export function GET() {
  const tenantId =
    process.env.AZURE_TENANT_ID || process.env.NEXT_PUBLIC_AZURE_TENANT_ID || "";
  const clientId =
    process.env.AZURE_CLIENT_ID || process.env.NEXT_PUBLIC_AZURE_CLIENT_ID || "";

  return NextResponse.json({ tenantId, clientId });
}
