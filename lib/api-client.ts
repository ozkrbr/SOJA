import type { IPublicClientApplication, AccountInfo } from "@azure/msal-browser";
import { loginRequest } from "@/lib/msal";

/**
 * fetch autenticado: anexa o ID token do MSAL como Bearer para as rotas de API.
 * Usa acquireTokenSilent (renova do cache/refresh token sem interação).
 */
export async function authFetch(
  instance: IPublicClientApplication,
  account: AccountInfo | undefined,
  input: string,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers);

  if (account) {
    try {
      const result = await instance.acquireTokenSilent({
        ...loginRequest,
        account,
      });
      if (result.idToken) {
        headers.set("Authorization", `Bearer ${result.idToken}`);
      }
    } catch {
      // Sem token silencioso (sessão expirada): segue sem header — a API
      // responderá 401 e o chamador trata.
    }
  }

  return fetch(input, { ...init, headers });
}
