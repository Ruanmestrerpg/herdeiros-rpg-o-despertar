import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthForm } from "@/components/AuthForm";
import { useUser } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => ({ redirect: typeof s.redirect === "string" ? s.redirect : undefined }),
  head: () => ({
    meta: [
      { title: "Entrar — Herdeiros RPG" },
      { name: "description", content: "Entre na sua conta Herdeiros RPG." },
      { property: "og:title", content: "Entrar — Herdeiros RPG" },
      { property: "og:description", content: "Acesse suas fichas e mesas." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect } = Route.useSearch();
  const { user } = useUser();
  const nav = useNavigate();
  useEffect(() => {
    if (!user) return;
    const saved = sessionStorage.getItem("post_login");
    sessionStorage.removeItem("post_login");
    const dest = redirect ?? saved ?? "/jogador";
    nav({ to: dest.startsWith("/") && !dest.startsWith("//") ? dest : "/jogador" });
  }, [user, redirect, nav]);
  return <AuthForm mode="login" redirect={redirect} />;
}
