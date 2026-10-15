# Plano de implementação — ALET-B18

1. **Contrato e persistência**
   - adicionar resposta de URL de preview de evidência;
   - copiar a mídia privada para uma nova chave própria do item de portfólio, sem compartilhar ownership destrutível com a evidência;
   - validar o prefixo de família das chaves privadas e testar contrato, preservação de mídia e proveniência.

2. **API de preview e promoção**
   - adicionar `GET .../evidence-submissions/:id/download-url` com família + `VALIDATED`;
   - gerar URL curta via `ObjectStorageService` e registrar leitura sensível;
   - cobrir isolamento, status inválido, storage ausente e sucesso em integração.

3. **Galeria e modal de promoção**
   - carregar submissões validadas e catálogo de tipos no contexto da página;
   - criar componente de seleção/preview e metadados editáveis;
   - marcar evidências promovidas e bloquear duplicação no cliente sem substituir a proteção do servidor.

4. **Validação**
   - testes UI para filtro por educando, preview, estados de erro, metadados e POST;
   - suíte web/API, typecheck, lint, i18n, boundaries e CI completo antes do merge.
