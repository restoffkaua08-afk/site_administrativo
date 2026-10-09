export const pageHead = (title: string, description: string) => () => ({
  meta: [
    { title: `${title} — Painel da Barbearia` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — Painel da Barbearia` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ],
});