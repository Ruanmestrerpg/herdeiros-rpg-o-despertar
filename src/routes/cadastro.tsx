import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/AuthForm";

export const Route = createFileRoute("/cadastro")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: typeof s.redirect === "string" ? s.redirect : undefined }),
  head: () => ({
    meta: [
      { title: "Cadastro — Herdeiros RPG" },
      { name: "description", content: "Crie sua conta no Herdeiros RPG." },
      { property: "og:title", content: "Cadastro — Herdeiros RPG" },
      { property: "og:description", content: "Crie sua conta e comece sua jornada." },
    ],
  }),
  component: () => {
    const { redirect } = Route.useSearch();
    return <AuthForm mode="cadastro" redirect={redirect} />;
  },
});
