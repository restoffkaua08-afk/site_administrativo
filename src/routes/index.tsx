import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel da Barbearia — Barbearia Nilles" },
      { name: "description", content: "Painel administrativo para dono e equipe gerenciarem agenda, clientes e serviços." },
      { property: "og:title", content: "Painel da Barbearia — Barbearia Nilles" },
      { property: "og:description", content: "Painel administrativo de agendamentos da barbearia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});