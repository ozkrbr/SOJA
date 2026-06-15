import { NavigationClient, type NavigationOptions, type Configuration } from "@azure/msal-browser";

// Impede o MSAL de redirecionar automaticamente após handleRedirectPromise.
// Sem isso, o MSAL v3 navega de volta à página que iniciou o login (/login),
// ignorando a opção navigateToLoginRequestUrl: false.
export class NoAutoRedirectClient extends NavigationClient {
  async navigateInternal(_url: string, _options: NavigationOptions): Promise<boolean> {
    return false; // deixa o app controlar a navegação
  }
}

/**
 * Constrói a configuração do MSAL a partir dos IDs obtidos em runtime
 * (via /api/config). Evita embutir tenant/client no bundle de build.
 */
export function buildMsalConfig(clientId: string, tenantId: string): Configuration {
  return {
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      redirectUri: "/api/auth/callback/microsoft-entra-id",
      postLogoutRedirectUri: "/login",
    },
    cache: {
      cacheLocation: "localStorage" as const,
    },
    system: {
      navigationClient: new NoAutoRedirectClient(),
    },
  };
}

export const loginRequest = {
  scopes: ["openid", "profile", "email"],
};

/** Busca a config pública do Entra ID no servidor (runtime). */
export async function fetchMsalConfig(): Promise<Configuration> {
  const res = await fetch("/api/config");
  if (!res.ok) throw new Error("Falha ao carregar configuração de autenticação");
  const { clientId, tenantId } = (await res.json()) as {
    clientId: string;
    tenantId: string;
  };
  if (!clientId || !tenantId) {
    throw new Error("Configuração de autenticação ausente no servidor (AZURE_CLIENT_ID / AZURE_TENANT_ID)");
  }
  return buildMsalConfig(clientId, tenantId);
}
