import type { Metadata } from "next";
import "./globals.css";
import MsalAuthProvider from "@/components/MsalAuthProvider";

export const metadata: Metadata = {
  title: "Custo de Produção — Soja 2026",
  description: "Simulador de custos e rentabilidade por hectare — Terrena Agronegócios",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, background: "#f4f1e9" }}>
        <MsalAuthProvider>{children}</MsalAuthProvider>
      </body>
    </html>
  );
}
