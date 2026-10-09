# Barbearia Nilles Admin

Painel administrativo da Barbearia Nilles, exportado do projeto Lovable e versionado neste repositório.

- Projeto original: https://lovable.dev/projects/648f6d8f-3452-476e-8c27-93c7617cf7b4
- Prévia original: https://id-preview--648f6d8f-3452-476e-8c27-93c7617cf7b4.lovable.app

## Desenvolvimento

Requer Bun (o projeto inclui `bun.lock`).

```bash
bun install
bun run dev
```

Verificações disponíveis:

```bash
bun run build
bun run lint
bun test
```

## Temas

Em **Configurações → Aparência**, o painel oferece tema claro, escuro e seguir o tema do dispositivo. A escolha é salva no armazenamento local do navegador e aplicada globalmente.

## Integração administrativa

O painel ainda sinaliza explicitamente o modo demonstração quando a API administrativa não está configurada. Não configure credenciais privilegiadas do Supabase no frontend. A integração real requer endpoints administrativos autenticados no backend.

## Estado do backup

Os 98 arquivos de texto do projeto Lovable foram sincronizados para este repositório. O favicon binário original não foi copiado nesta sincronização. A compilação deve ser executada no ambiente do projeto para confirmar a integridade antes de publicar.
