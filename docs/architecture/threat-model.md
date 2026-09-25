# Threat model — dados de responsáveis e estudantes

**Status:** vivo, atualizar sempre que uma nova categoria de dado sensível ou de operação de alto risco for adicionada
**Escopo:** dados pessoais de responsáveis (guardians) e educandos (learners) dentro de uma família — não cobre infraestrutura (rede, containers, dependências de terceiros), que fica fora deste documento

## Atores

- **Responsável (guardian)** — dono ou membro de uma família (`FamilyMember`). Pode ter papel `OWNER_GUARDIAN` ou `GUARDIAN`; ambos autenticam via `JwtAuthGuard` e só acessam recursos da própria família via `FamilyTenantGuard`.
- **Educando (learner)** — não tem conta própria por padrão. Quando o portal do estudante está habilitado, autentica via um `LearnerAccessGrant` (código de acesso com hash, bloqueio por tentativas) — ver `apps/api/src/modules/learner-access/`.
- **Mentor externo** — acesso concedido pontualmente via `MentorGrant`, escopado a uma família específica.
- **Platform-admin** — flag real em `User.isPlatformAdmin` (issue #101), usado para operações administrativas de catálogo, não para acessar dados de família.

## Ativos sensíveis

- Identidade e credenciais do responsável: email, `passwordHash`, `mfaSecret` (`User`).
- Dados do educando: nome completo, data de nascimento, `specialNeeds`, `notes` (necessidades especiais e observações pedagógicas — a informação mais sensível do modelo, já que pode revelar condição de saúde ou comportamental de uma criança).
- Trabalho do educando: arquivos de portfólio (`PortfolioItem`), evidências de competência (`EvidenceSubmission`) — podem incluir fotos, vídeos, texto livre.
- Documentos oficiais: relatórios/dossiês (`OfficialReport`), incluindo PDFs com hash de integridade que podem ser verificados publicamente por URL (`PublicReportVerificationController`).
- O pacote completo de exportação de dados da família (`DataExportJob`, endpoint `GET .../export/package`) — por definição, é a agregação de *todos* os ativos acima em um único payload.

## Superfície por módulo e mitigação já existente

| Módulo | Risco principal | Mitigação já existente |
| --- | --- | --- |
| `identity` | Credenciais, sessão | `AccountAuditLogEntry` (login, troca de senha, MFA), rate limiting, `AccountLockout`, refresh-token rotation com detecção de reuso |
| `families`/`learners` | Acesso cruzado entre famílias | `FamilyTenantGuard` valida que o ator pertence à família do `:familyId` da URL antes de qualquer handler rodar |
| `learner-access` | Um estudante acessar dados de outro estudante da mesma família | Testes explícitos de escalação de privilégio (`learner-portal.integration-spec.ts`): rejeita `learnerId` de irmão, sem campo para spoofar, revogação de acesso surte efeito na próxima requisição |
| `records` (portfolio) | Download não autorizado de arquivo privado | URLs de download são presigned e de curta duração (`ObjectStorageService.getPresignedDownloadUrl`), nunca URLs permanentes |
| `reports` | Dossiê/PDF vazando após geração | Hash SHA-256 embutido no PDF e endpoint público de verificação, mas o **acesso** ao PDF em si (quem gerou, quem exportou, quem apagou) só passou a ser auditado nesta issue |
| `settings` (data export) | Exfiltração em massa de todos os dados da família em uma única chamada | Antes desta issue: **nenhuma**, além do `FamilyTenantGuard`. Esse era o maior gap identificado. |

## O que este audit log cobre

A partir da issue #251, `SensitiveDataAccessLog` (módulo `privacy`) registra, de forma imutável (append-only, sem update/delete em nenhum ponto do código):

- Criação e exportação de pacotes de dados da família (`DATA_EXPORT_PACKAGE`).
- Criação, exportação (CSV/PDF) e exclusão de relatórios oficiais (`OFFICIAL_REPORT`).
- Leitura (via URL de download presigned) e exclusão de itens de portfólio (`PORTFOLIO_ITEM`).
- Criação de submissões de evidência (`EVIDENCE_SUBMISSION`).
- Criação e atualização de perfis de educando (`LEARNER`).

Cada registro grava `actorUserId`, `familyId`, `learnerId` (quando aplicável), a ação, o tipo de recurso e o id do recurso — nunca o conteúdo em si (sem PII duplicada, sem segredos).

## O que este audit log **não** cobre (decisão consciente, não esquecimento)

- Listagens (`GET` de coleções) e leituras individuais de recursos já protegidos por `FamilyTenantGuard` — são acesso de rotina dentro do próprio tenant, indistinguível de navegação normal do produto. Auditar toda leitura geraria volume alto sem sinal real de risco.
- Atualização/exclusão de `Family` em si — hoje não existe endpoint de atualização de família (`FamilyController` só tem create/list/get).
- Acesso do educando ao próprio portal — já tem seu próprio rastro de segurança dedicado (`LearnerAccessAttempt`, testes de escalação de privilégio citados acima); duplicar em `SensitiveDataAccessLog` misturaria dois domínios de auditoria diferentes.
- Operações automatizadas (jobs, seeders) sem um ator humano real — `SensitiveDataAuditService.record()` exige um `actorUserId`; fluxos de sistema não geram entradas artificiais só para preencher a tabela.

## Próximos passos sugeridos (não implementados nesta issue)

- Um dashboard operacional de erros/latência/saturação (issue #254) ajuda a detectar picos anômalos de acesso a estes endpoints, mas é infraestrutura de observabilidade, não deste domínio.
- Se o produto expandir para múltiplas jurisdições com obrigações de auditoria mais específicas (ex.: LGPD Art. 37, GDPR Art. 30), isso pertence ao motor de conformidade mais amplo já registrado na issue #248, não a uma expansão ad-hoc deste log.
