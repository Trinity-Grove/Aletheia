# ALET-B07 — Vitrine Curricular e Descoberta de Trilhas

Status: proposta arquitetural para validação.

## Contexto

O catálogo de modelos pedagógicos já existe e contém as disciplinas e objetivos iniciais necessários para iniciar um currículo. Hoje ele só aparece dentro de um modal no planejamento e a adoção não é idempotente. A feature deve transformar esse catálogo em uma superfície de descoberta explícita, sem criar uma segunda fonte de verdade.

## Resultado esperado

Uma família autenticada acessa `/curriculum/explore`, escolhe filtros de abordagem pedagógica e faixa etária, visualiza as trilhas publicadas e adota uma delas em um clique para o aluno e ano letivo selecionados.

Após a adoção:

- o plano do aluno/ano é atualizado para o modelo escolhido;
- disciplinas existentes da família são reutilizadas por nome;
- objetivos existentes com a mesma identidade não são duplicados;
- objetivos novos são criados com o conteúdo do modelo;
- a resposta informa quantos registros foram criados e quantos foram reutilizados.

## Arquitetura

### Fonte de dados

O catálogo continuará sendo servido por:

`GET /api/v1/families/:familyId/curriculum/templates/catalog`

O DTO de cada entrada será ampliado para incluir:

```ts
type PedagogicalModelCatalogEntryDto = {
  code: string;
  name: string;
  description?: string | null;
  subjects?: TemplateSubjectDefinition[];
  approach: PedagogicalModelApproach;
  recommendedAgeRange: { min: number; max: number };
  educationalStages: UniversalEducationalStage[];
};
```

`recommendedAgeRange` é uma recomendação de descoberta. `educationalStages` permanece alinhado à taxonomia universal do projeto.

### Aplicação

O frontend continuará usando:

`POST /api/v1/families/:familyId/curriculum/templates/apply`

com:

```ts
{
  learnerId: string;
  academicYearId: string;
  template: string;
}
```

O serviço de aplicação continuará atualizando o plano, mas a persistência de objetivos será idempotente por família, aluno, ano, disciplina e título do objetivo. O endpoint não deve criar uma entidade “adoption” separada neste incremento.

### Interface

Criar `CurriculumExploreGallery` como componente independente. Ele será responsável por:

- carregar o catálogo;
- exibir filtros de abordagem, faixa etária e estado “todos”;
- renderizar cartões com descrição, faixa etária, estágios, disciplinas e contagem de objetivos;
- aplicar a trilha selecionada;
- exibir loading, erro e resultado da adoção;
- bloquear a ação enquanto uma adoção estiver em andamento.

A página `/curriculum/explore` carregará família, alunos e ano letivo atual, fornecendo o contexto à galeria. O primeiro aluno será selecionado por padrão quando não houver foco definido. A navegação principal apontará `Currículos & Trilhas` para `/curriculum/explore`; a página manterá um retorno claro para o planejamento em `/curriculum`.

## Metadados de descoberta

O schema de metadados do modelo pedagógico receberá:

- `approach`: código da abordagem correspondente ao modelo;
- `recommendedAgeRange.min` e `.max`: inteiros entre 3 e 25, com `min <= max`;
- `educationalStages`: lista não vazia de estágios canônicos.

Os modelos existentes devem ser preenchidos com valores editoriais explícitos. A migração deve preservar `metadata.subjects` e apenas mesclar os novos campos. O seed deve produzir os mesmos campos para novas instalações.

O filtro por faixa etária usa interseção: uma trilha aparece quando sua recomendação inclui a idade selecionada. Os rótulos e as opções são traduzidos pelo frontend; o backend não envia texto de interface.

## Idempotência da adoção

Dentro da transação já usada pelo repositório:

1. validar aluno e ano dentro da família;
2. fazer upsert do plano do aluno/ano;
3. reutilizar ou criar cada disciplina por família/nome;
4. para cada objetivo inicial, procurar um objetivo existente pela família, aluno, ano, disciplina e título;
5. criar apenas os que não existirem;
6. retornar `subjectsCount`, `objectivesCount`, `reusedObjectivesCount` e eventual `subjectRelevance`.

O status de um objetivo existente nunca será resetado ao reaplicar uma trilha. Títulos são comparados exatamente, pois o conteúdo inicial do catálogo já é versionado como texto editorial.

## Estados e erros da interface

- Catálogo carregando: mostrar estado de carregamento localizado.
- Catálogo vazio: explicar que nenhuma trilha publicada está disponível.
- Falha de catálogo: mostrar alerta localizado e permitir nova tentativa por recarregamento da página.
- Sem aluno/ano: desabilitar adoção e orientar a seleção/cadastro do contexto.
- Adoção bem-sucedida: mostrar resumo de criados/reutilizados e marcar o cartão como adotado na sessão.
- Conflito ou erro HTTP: manter filtros e seleção, liberar o botão e mostrar a mensagem localizada.

## Acessibilidade e responsividade

- Filtros devem ser controles nativos rotulados.
- Cada cartão terá título semântico, descrição e botão com nome da trilha.
- O grid deve colapsar para uma coluna em viewport móvel sem overflow horizontal.
- O foco deve permanecer utilizável após sucesso ou erro; não depender apenas de cor para indicar estado.

## Testes de aceitação

### Contratos/API

- metadados válidos passam pelo schema;
- faixa invertida, idade fora do intervalo e estágio desconhecido falham;
- o resolver devolve os campos de descoberta;
- aplicar a mesma trilha duas vezes não cria objetivos duplicados;
- objetivos existentes mantêm status e são contabilizados como reutilizados;
- aluno ou ano de outra família continuam rejeitados.

### Frontend

- `/curriculum/explore` renderiza os modelos do catálogo;
- filtro por abordagem restringe os cartões;
- filtro por faixa etária usa interseção;
- cartão envia o template, aluno e ano corretos ao endpoint existente;
- sucesso mostra o resumo retornado;
- erro não perde a seleção;
- estado móvel não exige largura fixa.

## Decisões deliberadamente adiadas

- recomendações personalizadas com base no perfil da família;
- adoção simultânea para vários alunos;
- edição dos metadados pelo usuário;
- converter cada `LearningPath` editorial em cartão individual nesta mesma página.
