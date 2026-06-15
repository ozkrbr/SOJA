"use client";

import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function CallbackPage() {
  const isAuthenticated = useIsAuthenticated();
  const { inProgress } = useMsal();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Verifica se houve erro vindo da URL (ex: Microsoft recusou acesso)
  const urlError = searchParams.get("error");
  const urlErrorDesc = searchParams.get("error_description");

  useEffect(() => {
    if (inProgress !== "none") return;
    if (isAuthenticated) {
      void router.replace("/");
    }
    // Se não autenticado e não há código/error na URL, volta ao login
    if (!isAuthenticated && !searchParams.get("code") && !urlError) {
      void router.replace("/login");
    }
  }, [isAuthenticated, inProgress, router, searchParams, urlError]);

  if (urlError) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          background: "#f4f1e9",
          fontFamily: "sans-serif",
          gap: 12,
        }}
      >
        <p style={{ color: "#b91c1c", fontWeight: 600 }}>Erro de autenticação: {urlError}</p>
        {urlErrorDesc && <p style={{ color: "#6b7280", fontSize: 13 }}>{urlErrorDesc}</p>}
        <a href="/login" style={{ color: "#6b8f3f", fontSize: 14 }}>
          Tentar novamente
        </a>
      </div>
    );
  }

  return (
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
      Autenticando...
    </div>
  );
}
