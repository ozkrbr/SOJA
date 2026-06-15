import { NextRequest } from "next/server";
import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * Validação server-side do ID token do Microsoft Entra ID.
 *
 * O app usa MSAL como public client (SPA), sem sessão de servidor. Para proteger
 * as rotas de API, o cliente envia o ID token no header `Authorization: Bearer`.
 * Aqui validamos assinatura (via JWKS da Azure), emissor e audiência, e extraímos
 * o identificador estável do usuário (`oid`).
 */

const TENANT_ID = process.env.AZURE_TENANT_ID || process.env.NEXT_PUBLIC_AZURE_TENANT_ID;
const CLIENT_ID = process.env.AZURE_CLIENT_ID || process.env.NEXT_PUBLIC_AZURE_CLIENT_ID;

// JWKS remoto cacheado pelo próprio jose (refetch automático em rotação de chave).
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function getJwks() {
  if (!jwks) {
    jwks = createRemoteJWKSet(
      new URL(`https://login.microsoftonline.com/${TENANT_ID}/discovery/v2.0/keys`)
    );
  }
  return jwks;
}

export interface AuthUser {
  /** Object ID estável do usuário no Entra ID. */
  userId: string;
  email?: string;
  name?: string;
}

/**
 * Extrai e valida o usuário a partir do header Authorization.
 * Retorna null se ausente, inválido ou expirado.
 */
export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  if (!TENANT_ID || !CLIENT_ID) {
    // Sem configuração de Azure não há como validar — falha fechada.
    console.error("AZURE_TENANT_ID/AZURE_CLIENT_ID ausentes — não é possível validar token.");
    return null;
  }

  const header = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getJwks(), {
      audience: CLIENT_ID,
      issuer: `https://login.microsoftonline.com/${TENANT_ID}/v2.0`,
    });

    const userId = (payload.oid as string) || (payload.sub as string);
    if (!userId) return null;

    return {
      userId,
      email: (payload.preferred_username as string) || (payload.email as string) || undefined,
      name: (payload.name as string) || undefined,
    };
  } catch {
    return null;
  }
}
