# Taxonomia educacional universal

**Status:** decisão arquitetural vigente  
**Escopo:** todos os catálogos de currículo e todos os idiomas

## Decisão

Os catálogos usam uma taxonomia universal de etapas, independente do país:

| Código | Referência de progressão |
| --- | --- |
| `EARLY_YEARS` | Educação Infantil / pre-K e alfabetização inicial |
| `PRIMARY` | Ensino Fundamental inicial / elementary |
| `LOWER_SECONDARY` | Ensino Fundamental final / middle ou lower secondary |
| `UPPER_SECONDARY` | Ensino Médio / high ou upper secondary |

Os nomes acima são códigos de domínio. A interface pode exibir a tradução adequada ao idioma. “Educação Básica” descreve o conjunto das etapas e não deve ser usada como uma faixa isolada.

## Aplicação a idiomas

Cada idioma possui um domínio próprio com duas dimensões de progressão:

1. `NATIVE_LITERACY`: competências distribuídas nas quatro etapas universais.
2. `ADDITIONAL_LANGUAGE`: proficiência CEFR A1–C1, podendo receber recomendação de idade, mas sem ser confundida com etapa escolar.

Referências nacionais podem orientar limites de idade, exemplos e complexidade, mas não criam domínios ou caminhos paralelos por país. Essa separação mantém o catálogo comparável e permite que a mesma competência seja usada em diferentes contextos escolares.

## Implicação para novos catálogos

Novos domínios devem reutilizar os quatro códigos de etapa e a semântica de progressão acima. Se um currículo precisar de uma adaptação jurisdicional explícita, ela deve ser proposta como requisito de produto e avaliada separadamente, sem alterar a taxonomia universal por padrão.
