# Integração de feedback com o GitHub

Os responsáveis enviam relatos pelo widget de apoio e feedback. Os relatos permanecem pendentes até a triagem no backoffice. A aprovação abre uma issue; a rejeição exige motivo. A família recebe uma notificação após o desfecho.

| Variável | Padrão | Papel |
| --- | --- | --- |
| `GITHUB_ISSUE_PROVIDER` | Derivado do ambiente | `github` seleciona o gateway real. Fora de produção, outros valores usam o mock. |
| `GITHUB_TOKEN` | — | Token autorizado a criar e consultar issues no repositório. Com o gateway real, a ausência impede a inicialização. |
| `GITHUB_REPO_OWNER` | `Trinity-Grove` | Organização ou usuário proprietário do repositório. |
| `GITHUB_REPO_NAME` | `Aletheia` | Repositório que receberá as issues. |

Em produção, o gateway real é obrigatório, mesmo quando o provider foi configurado como `mock`. O sistema recusa iniciar sem token para evitar aprovações que anunciem uma issue inexistente.

Use um token com acesso ao repositório de destino e permissão de escrita em Issues. A documentação oficial descreve as permissões para [criar issues](https://docs.github.com/en/rest/issues/issues#create-an-issue). Armazene o token nas variáveis do serviço da API, sem incluí-lo em arquivos versionados. Esta funcionalidade usa `fetch` e não requer dependência npm adicional.

Cada issue inicia com `<!-- aletheia-feedback-id: UUID -->`. Antes de criar uma issue, a aprovação busca esse ID e confirma o marcador no corpo. Se a criação foi concluída, mas a gravação do desfecho no banco falhou, a retentativa reutiliza a issue encontrada. Um número e URL já gravados no relato também são reaproveitados. Uma falha do gateway mantém o relato em `PENDING`, grava `lastIssueError` e permite tentar novamente pelo backoffice; não envia uma notificação de aprovação.

O repositório de destino pode ser público. Por padrão, o sistema não copia nome ou e-mail para o relato nem para a issue. A identificação exige opt-in no envio e congela os dados da conta naquele momento. O formulário informa que o texto pode se tornar público, inclusive quando o autor permanece anônimo. O admin edita título, labels e nota própria; o texto enviado permanece inalterado.

Para preparar o banco de testes local, aplique as migrações antes de executar a integração. Não use `migrate reset` em um banco compartilhado:

```powershell
$env:DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/aletheia_test?schema=public'
pnpm --filter @aletheia/api exec prisma migrate deploy --schema prisma/schema.prisma
pnpm --filter @aletheia/api test -- test/feedback-github.integration-spec.ts
```

A integração usa Postgres real e o gateway mock, sem abrir issues externas.
