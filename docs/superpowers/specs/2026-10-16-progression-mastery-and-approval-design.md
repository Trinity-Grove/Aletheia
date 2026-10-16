# Especificação: domínio por rubrica e aprovação humana

## Objetivo

Expandir a progressão de competências além da contagem de evidências, permitindo que currículos que precisem de avaliação mais cuidadosa combinem evidências validadas, avaliação por rubrica e aprovação humana. A regra deve continuar configurável por política e não pode impor burocracia a todas as famílias ou competências.

Esta é uma fatia da issue #126. `EVIDENCE_COUNT` continua válido e inalterado para percursos que precisam apenas de um número mínimo de evidências validadas.

## Contexto atual

- A avaliação de progresso suporta apenas `EVIDENCE_COUNT`, com contagem de submissões `VALIDATED`, versão exata da competência e pré-requisitos.
- A ativação do currículo pode fixar a política e sua versão para o acompanhamento do educando.
- A conquista automática é idempotente e mantém snapshot histórico; uma rejeição posterior de evidência gera evento de revisão em vez de apagar a conquista.
- `AssessmentResult`, rubricas, validação de evidências e permissões de mentor já existem como conceitos/fluxos no domínio, mas não compõem hoje um caminho de política que condicione a conquista.
- A rota atual de avaliação aceita `assessorUserId` no payload e o serviço o persiste; esse valor não pode ser tratado como identidade confiável para uma decisão de progressão sem validação/derivação do ator autenticado.
- `MentorGrant` autoriza acesso a um educando, mas seu campo `role` é texto descritivo livre, não uma permissão de aprovar domínio. A simples existência de um grant não prova essa capacidade.
- A PR #360 associa projetos a evidências, mas não introduz uma política de progressão `PROJECTS` nem altera como progresso é calculado.

## Decisões de produto

1. **Políticas definem os requisitos.** Evidência, avaliação por rubrica e aprovação humana são gates configuráveis; não são etapas universais obrigatórias.
2. **`EVIDENCE_COUNT` não muda.** Famílias que usam o fluxo simples mantêm o comportamento atual, sem aprovação ou rubrica implícitas.
3. **Evidência validada é pré-requisito para avaliação baseada em evidência.** Submissões `UNVALIDATED` ou `REJECTED` não satisfazem gates nem contam como demonstração de domínio.
4. **Rubrica avalia critérios observáveis.** Quando uma política exigir avaliação, o resultado deve referenciar a rubrica/versionamento aplicável e satisfazer seu limiar publicado; não basta haver uma avaliação sem resultado suficiente.
5. **A aprovação humana é um gate final opcional.** Quando exigida, a competência não se torna `MASTERED` antes da decisão de uma pessoa autorizada.
6. **A família mantém autonomia.** Um responsável/educador autorizado da família pode aprovar. Um mentor externo só pode fazê-lo com capacidade de aprovação explicitamente concedida pela família, além de grant aceito, vigente e dentro do escopo. A autorização não pode ser inferida do texto livre `MentorGrant.role`.
7. **IA não decide domínio.** Pode ajudar a organizar evidências, explicar critérios ou preparar uma sugestão de avaliação, mas não pode validar evidência, aprovar a competência ou substituir o ator autorizado.
8. **Decisões são auditáveis.** Avaliações e aprovações registram ator, instante, alvo/versionamento e decisão. Revisões posteriores acrescentam eventos; não apagam a conquista histórica.

## Fluxo proposto

1. A família ativa um currículo e uma versão publicada de política compatível com as competências acompanhadas.
2. O educando reúne evidências; somente evidências validadas por ator autorizado entram nos gates que as exigem.
3. Se a política exigir avaliação por rubrica, um ator autorizado registra `AssessmentResult` contra a rubrica/versionamento previsto. O resultado só satisfaz o gate quando os critérios e o limiar definidos forem atingidos.
4. Se a política exigir aprovação humana, após os demais gates serem satisfeitos o acompanhamento entra em estado pendente de aprovação (`AWAITING_APPROVAL`, proposta de estado derivado). Não é ainda uma conquista.
5. Um responsável/educador da família ou mentor explicitamente autorizado aprova ou devolve/rejeita a solicitação, com registro auditável. A aprovação final reconcilia a conquista de maneira idempotente; uma decisão negativa mantém o acompanhamento sem domínio e deve explicar o próximo passo.
6. Sem gate humano, a política pode conceder domínio automaticamente quando seus gates objetivos forem satisfeitos, como ocorre hoje com `EVIDENCE_COUNT`.

## Modelo conceitual da política

O motor deve poder expressar uma combinação declarativa e versionada de requisitos, sem criar uma classe ou tabela por metodologia pedagógica. Conceitualmente, uma política pode exigir:

- um limiar de evidências validadas;
- um resultado mínimo para uma rubrica publicada/versionada;
- aprovação humana final, incluindo o papel/escopo de quem pode decidir.

Os requisitos aplicáveis e sua combinação (todos os gates exigidos precisam passar) pertencem à definição/versionamento da política. O contrato concreto de `policyType`/`rules`, os limiares suportados por rubrica e o enum final de status serão detalhados no plano de implementação, depois que esta spec for aprovada. Não inferir esses campos a partir de payloads livres nem aceitar regras desconhecidas como aprovação.

## Autorização e isolamento

- Toda consulta ou mutação deve ser scoped por família, educando, acompanhamento e política/versionamento fixados.
- Validação de evidência, avaliação usada como gate e aprovação usam o ator autenticado; não aceitam `actorId` escolhido pelo cliente. Para reutilizar `AssessmentResult`, a implementação deve derivar a autoria da sessão ou verificar o vínculo/grant do ator, em vez de confiar em `assessorUserId` enviado pelo cliente.
- A aprovação familiar não pode cruzar famílias.
- A autorização de mentor deve ser verificada no instante da decisão e limitada ao escopo concedido; concessão ausente, expirada ou revogada bloqueia a ação.
- Requisições repetidas não podem criar conquistas ou decisões duplicadas; transições concorrentes precisam manter consistência transacional.

## Estados e respostas ao usuário

- `NOT_STARTED`, `IN_PROGRESS`, `BLOCKED` e `MASTERED` continuam representando o progresso atual.
- `AWAITING_APPROVAL` é proposto como estado explícito quando todos os requisitos automáticos passaram e resta aprovação humana. Se a equipe preferir não expandir o enum de progresso, a API deverá expor status de aprovação separado, sem apresentar esse acompanhamento como `MASTERED`.
- Uma decisão de aprovação negativa nunca deve ser confundida com rejeição da evidência: deve explicar se o educando precisa de nova evidência, nova avaliação ou revisão humana.
- A interface explica quais gates faltam, quem pode agir e por que uma conquista ainda não foi concedida; mensagens devem ser localizadas em pt-BR, en-US e es-ES.

## Compatibilidade e histórico

- A política e sua versão permanecem fixadas ao ativar o acompanhamento; alterar uma definição publicada cria nova versão e não muda silenciosamente acompanhamentos já existentes.
- Avaliações fazem referência a versões exatas de competência, currículo, política e rubrica.
- Conquistas históricas e respectivos eventos de revisão são append-only. Uma evidência rejeitada depois da conquista pode colocar a conquista sob revisão conforme a regra existente, mas não apaga o fato histórico.
- O Diário de Aprendizagem e `LearningRecord` permanecem opcionais e intactos; nenhum registro livre vira avaliação ou aprovação automaticamente.
- Clientes existentes que usam `EVIDENCE_COUNT` devem manter o mesmo contrato e resultado.

## Critérios de aceite

- Uma família pode continuar usando `EVIDENCE_COUNT` sem alterações de UX ou semântica.
- Uma política que exige rubrica não concede domínio sem `AssessmentResult` válido, ligado à versão correta e acima do limiar exigido.
- Evidência não validada/rejeitada nunca satisfaz requisito de evidência.
- Uma política com aprovação humana não concede `MASTERED` antes de uma decisão positiva por ator autorizado.
- Responsáveis da família podem aprovar somente dentro da própria família; mentores só podem agir com concessão explícita, vigente e do escopo correto.
- Rejeição/devolução de aprovação tem motivo e orientação, não apaga avaliação ou evidência e deixa o acompanhamento não dominado.
- Eventos de avaliação, aprovação, revisão e conquista são auditáveis, versionados, idempotentes e protegidos contra repetição/concor­rência.
- A interface mostra requisitos pendentes e oferece conteúdo em pt-BR, en-US e es-ES.
- A IA não consegue executar validação, aprovação ou concessão final de domínio.

## Fora de escopo nesta fatia

- Implementar `PROJECTS` ou `HOURS` como tipos independentes de progressão.
- Fazer inferência automática de domínio a partir de conclusão de projeto, diário, agenda ou texto gerado por IA.
- Criar um avaliador autônomo de IA ou delegar a aprovação humana à IA.
- Tornar rubrica/aprovação obrigatórias para todos os currículos.
- Substituir o Diário de Aprendizagem, migrar seus dados ou alterar conquistas históricas existentes.
- Redesenhar permissões gerais de mentor; se aprovação por mentor entrar na primeira versão, limitar a mudança à capacidade explícita mínima no grant e manter o restante do modelo de acesso intacto.

## Questões para revisão antes do plano

1. Aprovar `AWAITING_APPROVAL` como estado de progresso explícito ou preferir um status de aprovação separado? O plano deve seguir a escolha registrada antes de modificar contratos.
2. A primeira versão deve incluir aprovação de mentor? O grant existente é por educando e não carrega autorização de aprovação; a opção segura é implementar primeiro para responsáveis da família e só incluir mentor se adicionarmos uma permissão explícita, sem inferi-la do campo `role`.
3. Como representar o limiar inicial de rubrica sem assumir que escalas qualitativas e numéricas são intercambiáveis? O primeiro corte pode suportar um tipo de escala apenas, desde que a política rejeite escalas incompatíveis.

## Relação com a issue #126

Esta spec avança o item 2 da #126 para além do tipo `EVIDENCE_COUNT`. A implementação deve manter os itens 3 e 4 conforme a decisão de coexistência e o snapshot imutável de conquistas já registrados na issue. A #126 permanece aberta até que os critérios e demais escopos do épico sejam verificados individualmente.
