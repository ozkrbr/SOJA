"use client";

import { useMsal } from "@azure/msal-react";
import { loginRequest } from "@/lib/msal";
import { useState } from "react";

export default function LoginPage() {
  const { instance } = useMsal();
  const [loading, setLoading] = useState(false);

  const entrar = async () => {
    setLoading(true);
    try {
      await instance.loginRedirect(loginRequest);
    } catch {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1a3c1a 0%, #2d5a27 50%, #1e4a1e 100%)",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.06,
          backgroundImage:
            "repeating-linear-gradient(115deg, transparent, transparent 28px, #f6f3ea 28px, #f6f3ea 29px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", width: "100%", maxWidth: 360, padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "rgba(255,200,50,0.15)",
              marginBottom: 20,
              fontSize: 36,
            }}
          >
            🌱
          </div>
          <h1
            style={{
              color: "#f5f0e8",
              fontSize: 36,
              fontWeight: 700,
              margin: "0 0 8px",
              letterSpacing: "-0.5px",
            }}
          >
            Custo Soja
          </h1>
          <p style={{ color: "rgba(245,240,232,0.65)", fontSize: 14, margin: 0, lineHeight: 1.5 }}>
            Simulador de custos e rentabilidade
            <br />
            Terrena Agronegócios
          </p>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.97)",
            borderRadius: 16,
            padding: "28px 24px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}
        >
          <p
            style={{
              textAlign: "center",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#6b7280",
              marginBottom: 20,
            }}
          >
            Acesso Corporativo
          </p>

          <button
            onClick={() => void entrar()}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              width: "100%",
              padding: "12px 20px",
              borderRadius: 8,
              border: "1.5px solid #e5e7eb",
              background: loading ? "#f9fafb" : "#fff",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 15,
              fontWeight: 500,
              color: "#111827",
            }}
          >
            {loading ? (
              <span>⏳</span>
            ) : (
              <svg width="18" height="18" viewBox="0 0 21 21" aria-hidden>
                <rect x="0" y="0" width="10" height="10" fill="#f25022" />
                <rect x="11" y="0" width="10" height="10" fill="#7fba00" />
                <rect x="0" y="11" width="10" height="10" fill="#00a4ef" />
                <rect x="11" y="11" width="10" height="10" fill="#ffb900" />
              </svg>
            )}
            {loading ? "Redirecionando..." : "Entrar com Microsoft"}
          </button>

          <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", marginTop: 16 }}>
            Use sua conta corporativa Microsoft 365
          </p>
        </div>

        <p
          style={{
            textAlign: "center",
            color: "rgba(245,240,232,0.35)",
            fontSize: 11,
            marginTop: 32,
            letterSpacing: "0.05em",
          }}
        >
          © {new Date().getFullYear()} Terrena Agronegócios
        </p>
      </div>
    </div>
  );
}
