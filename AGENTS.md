# Instruções arquiteturais para agentes

Antes de alterar catálogos, seeders ou definições de currículo, consulte esta regra e o registro em `docs/architecture/universal-educational-taxonomy.md`.

## Taxonomia educacional universal

- Use a mesma taxonomia educacional para todos os domínios e idiomas. Países (Brasil, EUA, México, Colômbia ou outros) são referências para calibrar idade, série e complexidade; não devem virar dimensões obrigatórias, domínios duplicados ou trilhas separadas.
- Os códigos canônicos de etapa são `EARLY_YEARS`, `PRIMARY`, `LOWER_SECONDARY` e `UPPER_SECONDARY`. `Educação Básica` é uma categoria abrangente, não uma etapa.
- Para idiomas, mantenha um domínio por língua e separe `NATIVE_LITERACY` de `ADDITIONAL_LANGUAGE`.
- A trilha nativa deve progredir pelas quatro etapas universais. A trilha de língua adicional deve usar CEFR A1, A2, B1, B2 e C1 como eixo de proficiência; CEFR não substitui a etapa educacional.
- Não introduza `country` ou equivalentes no modelo apenas para representar diferenças de sistemas escolares. Só crie uma variante jurisdicional quando houver requisito explícito do produto.

Ao criar um novo catálogo, preserve esses códigos e dimensões; traduza apenas os nomes e descrições apresentados ao usuário.

## Internacionalização Obrigatória no Frontend (i18n)

- Todo texto de interface voltado ao usuário DEVE ser internacionalizado. Textos fixos ("hardcoded") em JSX são estritamente proibidos em novas features e refatorações.
- Use `const { t, formatDate, formatCurrency, formatNumber } = useLocale()` de `@/lib/i18n/locale-context`.
- Chaves de tradução devem ser organizadas por domínio dentro de `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/<dominio>.ts`.
- Toda nova chave adicionada em `pt-BR` DEVE obrigatoriamente ser acompanhada de suas respectivas traduções em `en-US` e `es-ES` no mesmo commit. O TypeScript (`Dictionary`) e os testes de paridade bloqueiam o build se faltar tradução ou variável `{var}`.
- Datas, horários, números e moedas DEVEM utilizar os formatadores do `useLocale()`, respeitando a localidade ativa da família.
