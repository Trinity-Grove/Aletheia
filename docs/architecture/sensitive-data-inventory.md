# Inventário de dados sensíveis

**Status:** vivo, atualizar sempre que um novo campo pessoal/sensível for adicionado a um modelo existente ou um novo modelo com dados de responsável/educando for criado
**Escopo:** campos com dado pessoal ou sensível nos modelos `User`, `Family`, `Learner` e nos modelos de trabalho do educando (`PortfolioItem`, `EvidenceSubmission`, `AssessmentResult`, `OfficialReport`, `DataExportJob`). Não lista campos puramente estruturais (ids, timestamps de sistema, flags de configuração).

## `User` (responsável / conta)

| Campo | Classificação | Onde é lido/exportado |
| --- | --- | --- |
| `email` | Identificador pessoal | Login, `AuthService`, incluído no pacote de exportação de dados |
| `passwordHash` | Credencial | Nunca exposto via API — só comparado internamente pelo `AuthService` |
| `mfaSecret` | Credencial | Nunca exposto via API — só usado pelo `MfaService` para validar TOTP |
| `fullName` | Identificador pessoal | Perfil, relatórios (`generatedByLabel` em `ReportService.exportReportPdf`) |
| `termsOfUseAcceptedAt`/`privacyPolicyAcceptedAt` | Consentimento (não sensível em si, mas prova legal) | Auditoria de conformidade |

## `Family`

| Campo | Classificação | Onde é lido/exportado |
| --- | --- | --- |
| `name` | Identificador pessoal (nome da família) | Onboarding, relatórios, pacote de exportação |
| `countryCode`/`stateProvince` | Dado de localização (baixa sensibilidade) | Resolução de regime de privacidade (`resolvePrivacyRegime`), conformidade regional |

## `Learner` (educando)

| Campo | Classificação | Onde é lido/exportado |
| --- | --- | --- |
| `firstName`/`lastName`/`preferredName` | Identificador pessoal de menor | Perfil, relatórios, pacote de exportação |
| `birthDate` | Dado sensível de menor (idade real) | Cálculo de etapa educacional, certificados, relatórios oficiais |
| `specialNeeds` | **Dado sensível — categoria especial** (pode revelar condição de saúde/deficiência) | Só exibido no perfil do educando dentro da própria família; incluído no pacote de exportação completo |
| `notes` | **Dado sensível** (observações pedagógicas/comportamentais livres) | Mesmo escopo de `specialNeeds` |
| `customGrade` | Baixa sensibilidade | Relatórios |

## Trabalho e avaliação do educando

| Modelo | Campo sensível | Onde é lido/exportado |
| --- | --- | --- |
| `PortfolioItem` | `storageKey` (aponta para arquivo privado — pode ser foto, vídeo, texto livre da criança) | Download via URL presigned de curta duração (`GET .../portfolio/:id/download-url`, agora auditado) |
| `EvidenceSubmission` | `textContent`, `fileUrl`/`storageKey` | Submissão (`POST .../evidence-submissions`, agora auditado), validação por responsável |
| `AssessmentResult` | Notas/avaliações qualitativas sobre o desempenho do educando | Relatórios, dashboard familiar |
| `OfficialReport` | `content` (agrega notas, frequência, narrativas — o documento mais denso em PII do sistema) | Geração, exportação CSV/PDF e exclusão (todos agora auditados) |

## Pacote de exportação de dados (`DataExportJob` / `FamilyDataExportPackageDto`)

Por definição, agrega **todos** os campos acima em um único payload (`GET /families/:familyId/export/package`). É o ativo de maior risco de exfiltração em massa do sistema — daí ser o primeiro endpoint instrumentado pela issue #251 (`SensitiveDataAccessLog`, ação `EXPORT`, tipo `DATA_EXPORT_PACKAGE`).

## Dados fora deste inventário (intencionalmente)

- Dados de mentores externos (`MentorGrant`) e de doações/apoio comunitário (`DonationRecord`) são pessoais, mas não são dados de responsável/educando no sentido da issue #251 — ficam fora deste inventário específico.
- Conteúdo de catálogo (currículo, definições pedagógicas, packs comunitários) não é dado pessoal — é conteúdo do produto, não do usuário.
