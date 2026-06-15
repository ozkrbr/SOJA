"use client";

import { useState, useEffect } from "react";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider, useIsAuthenticated, useMsal } from "@azure/msal-react";
import { fetchMsalConfig, NoAutoRedirectClient } from "@/lib/msal";
import { usePathname, useRouter } from "next/navigation";

const CALLBACK_PATH = "/api/auth/callback/microsoft-entra-id";

const Loading = () => (
  <div
    style={{
      display: "flex",
      height: "100vh",
      alignItems: "center",
      justifyContent: "center",
      background: "#f4f1e9",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: "#6b8f3f",
      fontSize: 15,
    }}
  >
    Carregando...
  </div>
);

function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useIsAuthenticated();
  const { inProgress } = useMsal();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (inProgress !== "none") return;
    if (!isAuthenticated && pathname !== "/login" && pathname !== CALLBACK_PATH) {
      void router.replace("/login");
    }
  }, [isAuthenticated, inProgress, pathname, router]);

  if (inProgress !== "none") return <Loading />;
  if (!isAuthenticated && pathname !== "/login" && pathname !== CALLBACK_PATH) return <Loading />;

  return <>{children}</>;
}

export default function MsalAuthProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [instance, setInstance] = useState<PublicClientApplication | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);

    // Inicializa explicitamente e processa o redirect antes de passar para MsalProvider.
    // Isso garante que o código de autorização seja trocado por tokens antes que
    // qualquer hook MSAL tente ler o estado de autenticação.
    void (async () => {
      try {
        // Config obtida em runtime do servidor (mesma imagem em qualquer tenant).
        const config = await fetchMsalConfig();
        const pca = new PublicClientApplication(config);
        // Belt-and-suspenders: garante o NavigationClient mesmo que o config seja ignorado
        pca.setNavigationClient(new NoAutoRedirectClient());
        await pca.initialize();
        const result = await pca.handleRedirectPromise();
        if (result?.account) {
          pca.setActiveAccount(result.account);
        }
        setInstance(pca);
      } catch (e) {
        setError(String(e));
      }
    })();
  }, []);

  // SSR e hidratação inicial: null (sem mismatch)
  if (!mounted) return null;

  if (error) {
    return (
      <div style={{ padding: 32, fontFamily: "sans-serif", color: "#b91c1c" }}>
        Erro ao inicializar autenticação: {error}
      </div>
    );
  }

  if (!instance) return <Loading />;

  return (
    <MsalProvider instance={instance}>
      <AuthGuard>{children}</AuthGuard>
    </MsalProvider>
  );
}
