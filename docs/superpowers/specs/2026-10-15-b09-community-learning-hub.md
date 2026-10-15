# ALET-B09 — Hub Comunitário de Planos e Materiais

## Contexto

O B09 foi parcialmente entregue com o compartilhamento de atividades familiares. A lacuna restante é permitir que uma família publique voluntariamente materiais didáticos, planos de aula e cronogramas reutilizáveis por outras famílias, sem expor identidade, alunos, evidências ou dados do planejamento privado.

## Objetivo

Entregar um hub autenticado em que o responsável possa:

1. criar um recurso didático familiar;
2. mantê-lo privado ou compartilhá-lo explicitamente;
3. encontrar recursos publicados por outras famílias;
4. adotar um recurso como cópia privada independente;
5. editar ou retirar seus próprios recursos sem alterar cópias já adotadas.

## Fora de escopo

- substituir o catálogo oficial de `CurriculumPack`;
- publicar automaticamente lesson plans existentes, alunos, objetivos, registros ou evidências;
- sincronizar alterações entre o recurso publicado e cópias adotadas;
- upload de arquivo binário nesta primeira entrega;
- comentários, seguidores ou mensagens entre famílias;
- moderação prévia. O recurso só será público por escolha explícita e poderá ser despublicado pelo autor.

## Modelo de domínio

Adicionar `FamilyLearningResource`, relacionado somente à `Family`:

- `id`, `familyId`;
- `resourceType`: `MATERIAL`, `LESSON_PLAN` ou `CHRONOGRAM`;
- `title`, `description`, `subject`, `ageMin`, `ageMax`;
- `content` JSON validado pelo contrato discriminado por tipo;
- `visibility`: `PRIVATE` ou `PUBLIC`;
- `originResourceId` opcional, usado somente para rastrear adoção internamente;
- `createdAt`, `updatedAt`.

O JSON nunca conterá `familyId`, `userId`, learner IDs, nomes de alunos, registros, evidências ou chaves privadas de armazenamento.

### Conteúdo permitido

- `MATERIAL`: itens de texto ou link HTTPS/HTTP, cada um com título e descrição opcional. Links são normalizados/validados e não aceitam esquemas executáveis.
- `LESSON_PLAN`: etapas ordenadas, duração, materiais, objetivo, tarefa e observações didáticas. Não contém data específica, aluno ou subject ID de outra família.
- `CHRONOGRAM`: blocos semanais com dia da semana, horários, título, descrição e nome textual da disciplina. Não contém aluno ou academic year ID.

O `content` será limitado em tamanho e profundidade pelo schema para evitar payloads arbitrários e abuso do JSONB.

## API

Criar contratos em `packages/contracts/src/family-learning-resource.ts` e exportá-los pelo índice de contratos.

Endpoints autenticados:

- `GET /api/v1/community/learning-resources`: lista somente recursos `PUBLIC`, sem família autora e com paginação limitada;
- `POST /api/v1/families/:familyId/learning-resources`: cria recurso inicialmente `PRIVATE`;
- `GET /api/v1/families/:familyId/learning-resources`: lista recursos da família, incluindo privados;
- `GET /api/v1/families/:familyId/learning-resources/:id`: retorna somente recurso pertencente à família;
- `PATCH /api/v1/families/:familyId/learning-resources/:id`: atualiza conteúdo e visibilidade, sempre validando o schema completo;
- `DELETE /api/v1/families/:familyId/learning-resources/:id`: remove recurso próprio;
- `POST /api/v1/families/:familyId/learning-resources/adopt`: valida que a origem é pública e cria cópia privada transacional.

Todos os endpoints familiares usam `JwtAuthGuard` e `FamilyTenantGuard`. O catálogo comunitário exige autenticação, não expõe autor e não permite acesso a recurso privado por ID.

## Frontend

Criar `/curriculum/community` com um `CommunityLearningResourcesGallery` que contenha:

- explicação simples da diferença entre “manter privado” e “compartilhar”; 
- abas “Meus recursos” e “Explorar comunidade”;
- formulário/modal para os três tipos, com campos guiados e validação amigável;
- selo de visibilidade e ação clara de compartilhar/despublicar;
- cartões comunitários com resumo, tipo, faixa etária e ação “Usar na minha família”;
- confirmação de que adoção cria uma cópia privada independente;
- estados de carregamento, vazio, erro, sucesso e retry;
- layout responsivo sem classes utilitárias Tailwind no JSX, usando componentes de `@aletheia/ui` e classes existentes/BEM;
- link visível a partir da página de atividades.

Adicionar todas as chaves de interface em `pt-BR`, `en-US` e `es-ES`.

## Segurança e privacidade

- Conteúdo privado nunca entra na consulta comunitária.
- A resposta pública omite `familyId`, `originResourceId` e qualquer autor.
- A adoção copia apenas o snapshot didático permitido e força `PRIVATE`.
- Falhas de autorização retornam o mesmo comportamento de não encontrado para evitar enumeração.
- O servidor valida o conteúdo, limites e protocolo dos links; o frontend não é a camada de segurança.
- Operações de publicação e adoção devem ser cobertas por testes de isolamento entre famílias.

## Testes e critérios de aceite

### Contratos

- schemas aceitam os três tipos válidos;
- schemas rejeitam IDs de família/aluno, conteúdo fora do limite, tipo desconhecido e links com protocolo inseguro;
- respostas públicas não exigem nem aceitam campos de identidade.

### API

- criação começa privada;
- somente o proprietário consegue consultar, editar, excluir ou compartilhar recurso;
- listagem pública retorna apenas `PUBLIC` e nunca dados da família;
- adoção de privado falha;
- adoção gera snapshot privado e não altera a origem;
- duas famílias não conseguem acessar ou mutar recursos uma da outra;
- despublicar remove o recurso do catálogo sem apagar cópias adotadas.

### Web

- usuário consegue criar os três tipos;
- usuário consegue publicar, despublicar e excluir seus recursos;
- usuário consegue explorar e adotar um recurso;
- a cópia adotada aparece em “Meus recursos” com selo privado;
- estados de carregamento, vazio, erro e sucesso são renderizados;
- fluxo mantém cobertura i18n simétrica e não quebra a página de atividades.

### Verificação

- testes unitários de contratos, repositório, serviço e componentes;
- integração da API para autorização, publicação, isolamento e adoção;
- `pnpm --filter @aletheia/contracts test`;
- `pnpm --filter @aletheia/api test` nos testes afetados;
- `pnpm --filter @aletheia/web test` nos testes afetados;
- `pnpm audit:i18n`;
- `node scripts/check-module-boundaries.mjs`;
- typecheck/lint dos pacotes alterados.

## Definição de pronto do B09

O B09 só será considerado fechado quando os três tipos puderem ser criados, voluntariamente publicados, descobertos por outra família e adotados como cópia privada, com testes comprovando isolamento e sem vazamento de identidade ou contexto de aluno.
