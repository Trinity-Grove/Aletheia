# UX de linguagem, jornada integrada e assistência contextual

## Contexto

O Aletheia já possui módulos funcionais para currículo, agenda, aulas, diário de aprendizagem, portfólio, frequência e relatórios. A cobertura estrutural de traduções está completa, mas a experiência ainda usa títulos técnicos ou poéticos demais, mistura vocabulário entre idiomas e exige que a pessoa descubra sozinha como os módulos se relacionam.

Também existe um fluxo de IA para gerar rascunhos de aulas com consentimento parental, quota, anonimização e aprovação humana. A próxima evolução deve reutilizar esses controles para oferecer ajuda contextual ao longo da jornada, sem criar um chatbot genérico ou permitir alterações automáticas.

## Objetivo

Tornar o produto fácil de aprender durante o uso, usando linguagem simples, títulos orientados à tarefa e conexões explícitas entre as etapas:

```text
Descobrir uma trilha → Planejar → Agendar → Realizar → Registrar → Guardar evidência → Relatar
```

O usuário deve entender, em cada tela:

1. onde está;
2. o que aquela área resolve;
3. qual é o próximo passo recomendado;
4. como voltar ao contexto anterior;
5. quando a IA está sugerindo algo e o que precisa ser revisado.

## Escopo

### 1. Glossário e títulos

Adotar um glossário compartilhado nos três idiomas (`pt-BR`, `en-US`, `es-ES`) e substituir títulos com jargão, metáforas ou dupla finalidade.

Termos principais:

| Conceito | pt-BR | en-US | es-ES |
| --- | --- | --- | --- |
| Pessoa em aprendizagem | Educando | Learner | Estudiante |
| Planejamento | Planejamento curricular | Curriculum planning | Planificación curricular |
| Descoberta | Descobrir trilhas de aprendizagem | Discover learning paths | Descubrir rutas de aprendizaje |
| Agenda | Agenda de estudos | Study schedule | Agenda de estudio |
| Registros | Diário de aprendizagem | Learning journal | Diario de aprendizaje |
| Produções | Trabalhos e portfólio | Work portfolio | Portafolio de trabajos |
| Frequência | Frequência e horas de estudo | Attendance and study hours | Asistencia y horas de estudio |
| Saídas oficiais | Relatórios e históricos | Reports and academic records | Informes e historiales |
| Prática de fé | Devocional em família | Family devotional | Devocional en familia |
| Orientação jurídica | Guia legal e primeiros passos | Legal guide and getting started | Guía legal y primeros pasos |

Regras de escrita:

- títulos devem preferir verbos ou nomes concretos;
- subtítulos devem explicar o benefício e a próxima ação;
- evitar ampersand (`&`) em títulos de usuário;
- evitar termos como “domínio”, “conformidade”, “vitrine”, “portfólio vivo” e “amparo” quando não forem explicados;
- manter `Currículo`, `Agenda`, `Diário`, `Portfólio` e `Relatórios` como âncoras curtas de navegação;
- o espanhol deve usar `Estudiante` de forma consistente nas telas de usuário;
- nenhum título ou CTA novo pode ser escrito diretamente no JSX.

### 2. Jornada integrada

Cada módulo deve expor links ou ações contextuais para o módulo seguinte, preservando `familyId`, educando, ano letivo, atividade, objetivo e evidência.

#### Currículo

- mostrar `Planejar esta trilha` ou `Adicionar ao planejamento`;
- depois da adoção, oferecer `Montar agenda`;
- manter acesso de retorno para `Descobrir trilhas` sem substituir a rota principal de currículo.

#### Agenda e aulas

- após concluir uma aula, mostrar `Registrar aprendizagem` e `Adicionar evidência`;
- preservar o vínculo com a atividade curricular e o educando;
- deixar claro que concluir uma aula não cria automaticamente uma evidência completa sem confirmação.

#### Diário

- permitir relacionar o registro ao objetivo curricular;
- oferecer `Adicionar ao portfólio` quando houver mídia ou produção relevante;
- exibir a origem do registro: aula, atividade ou entrada manual.

#### Portfólio

- exibir educando, atividade, objetivo e data de origem;
- diferenciar rascunho, enviado, validado e publicado;
- oferecer retorno para o registro e para a atividade de origem;
- usar os fluxos de permissões, mídia, validação e promoção previstos nas frentes ALET-B14–B19.

#### Relatórios

- permitir navegar da síntese para os registros e evidências que a sustentam;
- informar quando um dado está incompleto;
- nunca apresentar sugestão de IA como fato confirmado.

#### Dashboard

Criar um bloco de próximo passo contextual, baseado no estado real da família. Exemplos:

- `Cadastre o primeiro educando`;
- `Escolha uma trilha de aprendizagem`;
- `Agende a primeira aula`;
- `Registre o que foi aprendido hoje`;
- `Adicione uma evidência ao portfólio`.

O bloco deve ter uma ação principal e, no máximo, uma ação secundária. Não deve apresentar uma lista extensa de tarefas concorrentes.

### 3. Assistência contextual com IA

A primeira etapa de IA fora das aulas deve ser contextual e orientada à tarefa. Não será criado um chat aberto sem contexto.

Casos prioritários:

1. currículo: explicar uma trilha e sugerir uma sequência semanal;
2. agenda: adaptar uma rotina quando houver dias perdidos ou excesso de atividades;
3. diário: transformar anotação livre em rascunho estruturado;
4. portfólio: sugerir título, descrição, tags e reflexão da evidência;
5. relatórios: criar rascunho narrativo usando somente dados existentes;
6. ajuda: explicar campos e indicar o próximo passo da tela atual.

Contrato de segurança para todos os casos:

- consentimento parental explícito;
- minimização e anonimização de dados sensíveis;
- quota por família;
- contexto limitado à família e ao educando autorizado;
- resultado salvo como `PENDING_REVIEW` ou equivalente;
- aprovação humana antes de agendar, publicar ou alterar dados;
- indicação visível de que o conteúdo foi sugerido por IA;
- auditoria do uso e dos dados utilizados;
- possibilidade de descartar sem efeitos colaterais;
- respostas fundamentadas apenas nos dados disponíveis, sem inventar progresso, presença ou notas.

O fluxo existente de rascunho de aula é a referência de interação e de controles técnicos.

## Fora do escopo desta frente

- reescrever todo o backend de IA;
- criar um chatbot geral;
- alterar a taxonomia educacional universal;
- mudar permissões comunitárias do portfólio, que permanecem nas issues ALET-B14–B19;
- substituir a navegação principal de `/curriculum` por `/curriculum/explore`;
- criar automaticamente registros, evidências, aulas ou relatórios sem confirmação.

## Critérios de aceite

### Conteúdo e i18n

- títulos e subtítulos prioritários seguem o glossário nos três idiomas;
- não existem novas strings hardcoded em JSX;
- a auditoria de cobertura e paridade de traduções continua em 100%;
- textos de fallback e estados vazios também são traduzidos;
- a terminologia para educando/estudante é consistente por idioma.

### Jornada

- cada etapa principal oferece uma ação clara de continuidade;
- os vínculos entre currículo, aula, registro, evidência e relatório são preservados;
- estados vazios explicam como começar;
- o dashboard mostra somente o próximo passo mais relevante;
- os fluxos funcionam em viewport móvel sem ações ocultas ou cartões impossíveis de usar.

### IA

- cada sugestão informa que é gerada por IA;
- nenhuma sugestão altera dados sem aprovação explícita;
- consentimento, quota, anonimização e auditoria são reutilizados;
- a IA não pode gerar afirmações sem fonte nos dados da família;
- descarte e erro retornam o usuário ao fluxo original.

## Estratégia de entrega

1. PR de conteúdo: glossário, títulos, subtítulos, CTAs e remoção de hardcodes.
2. PR de jornada: ações contextuais, vínculos entre módulos e próximo passo do dashboard.
3. PR de IA contextual: contratos, endpoints e componentes que reutilizam o padrão de rascunho aprovado.

Cada PR deve manter testes de tradução, testes de integração dos vínculos e testes responsivos dos fluxos alterados.

