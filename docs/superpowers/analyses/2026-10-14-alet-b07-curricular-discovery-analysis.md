# ALET-B07 — Análise de Estado e Decisões de Escopo

Status: rascunho para validação do agente responsável pela implementação.

## Objetivo

Entregar uma vitrine curricular acessível em `/curriculum/explore`, com descoberta de trilhas por abordagem pedagógica e faixa etária, e adoção em um clique para o aluno/ano letivo selecionados.

## Evidências encontradas

- A navegação principal aponta `Currículo` para `/curriculum`; a descoberta de modelos fica escondida em `TemplateModal`.
- O endpoint familiar `GET /api/v1/families/:familyId/curriculum/templates/catalog` já retorna modelos publicados e suas disciplinas com `starterObjectives`.
- O endpoint `POST /api/v1/families/:familyId/curriculum/templates/apply` já recebe `learnerId`, `academicYearId` e `template`.
- A aplicação atual reutiliza disciplinas por nome, mas cria todos os objetivos novamente em cada aplicação. Portanto, o critério “sem duplicar dados” ainda não está garantido.
- A galeria de `CurriculumPack` existente é voltada a pacotes portáveis/editáveis. Os pacotes oficiais atuais possuem metadados de categoria e estágio, mas não carregam uma matriz de `starterObjectives` diretamente aplicável ao currículo do aluno.
- A fonte mais fiel para “trilhas” neste incremento é, portanto, o catálogo de modelos pedagógicos. Os pacotes continuam disponíveis em `/curriculum/packs` como superfície complementar.
- O projeto já possui a taxonomia canônica `EARLY_YEARS`, `PRIMARY`, `LOWER_SECONDARY` e `UPPER_SECONDARY`, além de calibração de idade. A feature deve reutilizar essa taxonomia.

## Decisão recomendada

Usar o catálogo de modelos pedagógicos como fonte da vitrine. Cada modelo será apresentado como uma trilha adotável, com descrição, abordagem, faixa etária recomendada, estágios educacionais, disciplinas e quantidade de objetivos iniciais.

O frontend reutilizará os endpoints existentes; não será criado um endpoint paralelo de descoberta. O backend apenas enriquecerá o DTO do catálogo com metadados de descoberta e tornará a aplicação idempotente.

## Fora de escopo

- Reescrever a galeria de pacotes curriculares.
- Criar marketplace, pagamentos, avaliações ou recomendação personalizada.
- Alterar a semântica de pacotes portáveis.
- Criar uma nova entidade de “trilha” no banco.
- Reorganizar o restante do planejamento curricular além do link de descoberta e da adoção existente.

## Riscos e mitigação

| Risco | Mitigação |
| --- | --- |
| Modelos antigos não possuem metadados de descoberta | Migração JSONB explícita para as versões publicadas atuais; o resolver valida defaults seguros. |
| Reaplicar uma trilha duplica objetivos | Dentro da mesma transação, procurar objetivo pela identidade família/aluno/ano/disciplina/título antes de criar. |
| A faixa etária virar dimensão curricular rígida | Persistir idade apenas como recomendação; os estágios canônicos continuam sendo a dimensão educacional. |
| Vitrine funcionar sem aluno ou ano selecionado | Selecionar o primeiro aluno e o ano atual por padrão; desabilitar adoção e explicar o requisito quando não houver contexto. |
| Textos divergirem entre idiomas | Adicionar as chaves pt-BR, en-US e es-ES no mesmo commit e manter textos de interface em `useLocale`. |

## Critério de validação para o outro agente

O desenho está adequado se o agente confirmar que:

1. “Trilha” deve significar um modelo pedagógico publicado, e não um `CurriculumPack` portável.
2. A adoção deve usar o aluno e o ano letivo selecionados e continuar no endpoint de aplicação existente.
3. Reaplicar a mesma trilha, ou outra trilha com o mesmo objetivo, não deve criar um segundo objetivo equivalente.
4. Abordagem e idade são metadados de descoberta; não substituem a taxonomia educacional canônica.

## Avaliação incorporada

- A navegação principal deve continuar apontando `Currículo` para `/curriculum`, pois esse contrato já é coberto por `product-shell.test.tsx` e preserva o acesso ao planejamento existente. A descoberta será acessível por CTA/aba em `/curriculum`, e `/curriculum/explore` terá retorno claro para o planejamento.
- O JSX da galeria deve usar `@aletheia/ui` e classes BEM/tokens CSS; não serão introduzidos utilitários Tailwind.
- A migração de metadados deve preservar `metadata.subjects`. Como `PedagogicalModelDefinition` publicado é versionado e o seeder não altera conteúdo existente, não usar `UPDATE` in-place como estratégia padrão. Criar uma nova versão publicada com `metadata` mesclado, preservando a versão anterior.
- Props de callbacks da galeria usarão sintaxe de método (`onAdopt?(templateCode: string): Promise<void> | void`) para permanecer compatível com os scanners do repositório.
- Toda cópia nova será adicionada simultaneamente a `pt-BR`, `en-US` e `es-ES`, seguida de `pnpm audit:i18n`.
