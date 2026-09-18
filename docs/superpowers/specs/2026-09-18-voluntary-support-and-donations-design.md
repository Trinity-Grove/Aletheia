# Design Document: Módulo de Apoio Voluntário e Doações Comunitárias (PIX & Google Pay)

**Data:** 2026-09-18  
**Status:** Aprovado  
**Escopo:** `@aletheia/contracts`, `apps/api`, `apps/web`  
**Referência:** [Issue #32](https://github.com/Trinity-Grove/Aletheia/issues/32)

---

## 1. Contexto & Propósito

Originalmente, a [Issue #32](https://github.com/Trinity-Grove/Aletheia/issues/32) previa um modelo tradicional de billing SaaS comercial (catálogo fechado de planos, paywalls com bloqueio de backend por "entitlements", limites artificiais de alunos e suspensão por inadimplência).

Em conformidade com a visão de impacto social e educacional do projeto Aletheia, o modelo foi reformulado integralmente:
1. **Zero Paywalls ou Bloqueios:** O Aletheia é e permanece 100% gratuito e irrestrito para todas as famílias. Não existem limites de alunos, bloqueios de disciplinas ou recursos restritos por pagamento.
2. **Apoio Comunitário Voluntário:** A manutenção e a evolução do projeto são sustentadas por contribuições voluntárias de famílias e apoiadores.
3. **Modalidades de Apoio:**
   - **Apoio Pontual:** Doação única via **PIX** (QR Code dinâmico instantâneo e código Copia e Cola) ou **Google Pay**.
   - **Apoio Recorrente (Mantenedor Mensal):** Contribuição mensal voluntária recorrente, cancelável a qualquer momento pela própria família com 1 clique.
   - **Valores Sugeridos e Livres:** R$ 15, R$ 30, R$ 50, R$ 100 ou qualquer valor personalizado (mínimo de R$ 5,00 para cobertura operacional de taxas do gateway).
4. **Transparência e Igualdade:** Histórico de recibos e comprovantes para a família, confirmação automatizada em tempo real via webhook idempotente, sem qualquer diferenciação funcional de acesso entre apoiadores e não apoiadores (100% igualitário).

---

## 2. Contratos e Schemas Zod (`@aletheia/contracts`)

### 2.1. Tipos e Enums
```ts
export const donationFrequencySchema = z.enum(['ONE_TIME', 'MONTHLY']);
export type DonationFrequency = z.infer<typeof donationFrequencySchema>;

export const donationPaymentMethodSchema = z.enum(['PIX', 'GOOGLE_PAY', 'CREDIT_CARD']);
export type DonationPaymentMethod = z.infer<typeof donationPaymentMethodSchema>;

export const donationStatusSchema = z.enum(['PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED']);
export type DonationStatus = z.infer<typeof donationStatusSchema>;
```

### 2.2. Intenção de Doação (Criar Pagamento)
```ts
export const createDonationIntentSchema = z.object({
  amountCents: z.number().int().min(500, 'Valor mínimo de apoio é R$ 5,00'),
  frequency: donationFrequencySchema.default('ONE_TIME'),
  paymentMethod: donationPaymentMethodSchema.default('PIX'),
  donorName: z.string().min(2).max(150).optional(),
  donorEmail: z.string().email().optional(),
});

export type CreateDonationIntentDto = z.input<typeof createDonationIntentSchema>;

export const donationIntentResponseSchema = z.object({
  donationId: z.string().uuid(),
  amountCents: z.number().int(),
  currency: z.literal('BRL'),
  status: donationStatusSchema,
  paymentMethod: donationPaymentMethodSchema,
  frequency: donationFrequencySchema,
  pixQrCodeUrl: z.string().optional(),
  pixCopiaECola: z.string().optional(),
  gatewayClientSecret: z.string().optional(),
  expiresAt: z.string(),
  createdAt: z.string(),
});

export type DonationIntentResponseDto = z.infer<typeof donationIntentResponseSchema>;
```

### 2.3. Histórico de Doações e Recibos
```ts
export const donationRecordResponseSchema = z.object({
  id: z.string().uuid(),
  familyId: z.string().uuid().nullable().optional(),
  donorName: z.string().nullable().optional(),
  donorEmail: z.string().nullable().optional(),
  amountCents: z.number().int(),
  currency: z.string(),
  frequency: donationFrequencySchema,
  paymentMethod: donationPaymentMethodSchema,
  status: donationStatusSchema,
  pixCopiaECola: z.string().nullable().optional(),
  confirmedAt: z.string().nullable().optional(),
  createdAt: z.string(),
});

export type DonationRecordResponseDto = z.infer<typeof donationRecordResponseSchema>;

export const supporterSubscriptionResponseSchema = z.object({
  id: z.string().uuid(),
  familyId: z.string().uuid(),
  amountCents: z.number().int(),
  currency: z.string(),
  paymentMethod: donationPaymentMethodSchema,
  status: donationStatusSchema,
  gatewaySubscriptionId: z.string(),
  cancelledAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type SupporterSubscriptionResponseDto = z.infer<typeof supporterSubscriptionResponseSchema>;
```

---

## 3. Modelo de Banco de Dados (`apps/api` / Prisma)

### 3.1. Migração Prisma
```prisma
enum DonationFrequency {
  ONE_TIME
  MONTHLY
}

enum DonationStatus {
  PENDING
  CONFIRMED
  FAILED
  CANCELLED
}

enum DonationPaymentMethod {
  PIX
  GOOGLE_PAY
  CREDIT_CARD
}

model DonationRecord {
  id                    String                @id @default(uuid()) @db.Uuid
  familyId              String?               @map("family_id") @db.Uuid
  donorName             String?               @map("donor_name")
  donorEmail            String?               @map("donor_email")
  amountCents           Int                   @map("amount_cents")
  currency              String                @default("BRL")
  frequency             DonationFrequency     @default(ONE_TIME)
  paymentMethod         DonationPaymentMethod @map("payment_method")
  status                DonationStatus        @default(PENDING)
  gatewayProvider       String                @map("gateway_provider") // "mock" | "mercadopago" | "asaas"
  gatewayTransactionId  String?               @map("gateway_transaction_id")
  gatewaySubscriptionId String?               @map("gateway_subscription_id")
  pixQrCodeUrl          String?               @map("pix_qr_code_url")
  pixCopiaECola         String?               @map("pix_copia_e_cola")
  notes                 String?
  confirmedAt           DateTime?             @map("confirmed_at") @db.Timestamptz
  createdAt             DateTime              @default(now()) @map("created_at") @db.Timestamptz
  updatedAt             DateTime              @updatedAt @map("updated_at") @db.Timestamptz

  family                Family?               @relation(fields: [familyId], references: [id], onDelete: SetNull)

  @@index([familyId])
  @@index([gatewayTransactionId])
  @@map("donation_records")
}

model SupporterSubscription {
  id                    String                @id @default(uuid()) @db.Uuid
  familyId              String                @map("family_id") @db.Uuid
  amountCents           Int                   @map("amount_cents")
  currency              String                @default("BRL")
  paymentMethod         DonationPaymentMethod @map("payment_method")
  status                DonationStatus        @default(PENDING)
  gatewayProvider       String                @map("gateway_provider")
  gatewaySubscriptionId String                @unique @map("gateway_subscription_id")
  cancelledAt           DateTime?             @map("cancelled_at") @db.Timestamptz
  createdAt             DateTime              @default(now()) @map("created_at") @db.Timestamptz
  updatedAt             DateTime              @updatedAt @map("updated_at") @db.Timestamptz

  family                Family                @relation(fields: [familyId], references: [id], onDelete: Cascade)

  @@index([familyId])
  @@map("supporter_subscriptions")
}
```

---

## 4. Arquitetura do Backend (`apps/api`)

### 4.1. Camada de Abstração do Gateway (`DonationGateway`)
Para garantir testabilidade em CI/CD sem dependência de credenciais reais ou internet externa:
```ts
export interface DonationGateway {
  createOneTimeIntent(params: {
    donationId: string;
    amountCents: number;
    paymentMethod: DonationPaymentMethod;
    donorName?: string;
    donorEmail?: string;
  }): Promise<{
    gatewayTransactionId: string;
    pixQrCodeUrl?: string;
    pixCopiaECola?: string;
    clientSecret?: string;
    expiresAt: Date;
  }>;

  createSubscriptionIntent(params: {
    subscriptionId: string;
    familyId: string;
    amountCents: number;
    paymentMethod: DonationPaymentMethod;
    donorEmail?: string;
  }): Promise<{
    gatewaySubscriptionId: string;
    pixCopiaECola?: string;
    clientSecret?: string;
  }>;

  cancelSubscription(gatewaySubscriptionId: string): Promise<boolean>;

  parseWebhook(payload: unknown, signatureHeader?: string): Promise<{
    gatewayTransactionId?: string;
    gatewaySubscriptionId?: string;
    status: DonationStatus;
    confirmedAt?: Date;
  }>;
}
```

Implementações:
1. `MockDonationGateway`: Usado por padrão em testes e em ambientes sem chave de API configurada. Gera código PIX válido para teste e permite confirmação instantânea.
2. `MercadoPagoDonationGateway` / `AsaasDonationGateway`: Ativado quando as variáveis `DONATION_GATEWAY_PROVIDER` e tokens correspondentes estiverem presentes.

### 4.2. Endpoints da API
- `POST /api/v1/families/:familyId/donations/create-intent`
- `GET /api/v1/families/:familyId/donations/:id/status`
- `GET /api/v1/families/:familyId/donations/history`
- `GET /api/v1/families/:familyId/donations/subscriptions`
- `DELETE /api/v1/families/:familyId/donations/subscriptions/:id`
- `POST /api/v1/donations/webhooks/:provider` (Endpoint público de webhook com verificação de assinatura e idempotência)

---

## 5. Interface do Usuário (`apps/web`)

1. **Página Dedicada `/support` & Aba `/settings/support`:**
   - Apresentação acolhedora e calorosa dos objetivos do Aletheia e convite para fazer parte da comunidade mantenedora.
   - Alternância entre **Doação Única** e **Apoio Mensal Recorrente**.
   - Seletor de valores: Botões rápidos (`R$ 15`, `R$ 30`, `R$ 50`, `R$ 100`) + campo para valor customizado.
   - Seleção de forma de pagamento:
     - **PIX:** Exibe o QR Code e botão de cópia com 1 clique.
     - **Google Pay:** Botão nativo estilizado do Google Pay.
   - Polling automático de confirmação para exibir mensagem de gratidão assim que o PIX for pago.
2. **Histórico de Contribuições:**
   - Relação de doações realizadas pela família com data, valor e recibo digital.
   - Opção para cancelar apoio mensal a qualquer momento sem dificuldades.
3. **Pontos de Acesso na Aplicação:**
   - Link discreto no rodapé e menu de perfil: *"Apoiar o Projeto ❤️"*.

---

## 6. Critérios de Teste e Aceite

- **Validação de Contratos:**
  - `createDonationIntentSchema` rejeita valores menores que 500 centavos (R$ 5,00) e aceita frequências e métodos válidos.
- **Backend & Webhooks:**
  - Criação de registros com status `PENDING`.
  - Processamento idempotente de webhooks: se o mesmo evento de confirmação for recebido duas vezes, a doação é confirmada uma única vez sem efeitos colaterais.
  - Cancelamento correto de assinaturas de apoio mensal.
  - Multi-tenant: cada família acessa exclusivamente o seu histórico de doações.
- **Frontend:**
  - Renderização fluida da página `/support` e `/settings/support`.
  - Cópia do código PIX copia-e-cola com feedback visual.
  - Detecção de pagamento e tela de agradecimento.
- **Regras de Governança:**
  - Zero trailers de IA (`Co-Authored-By`, `Generated-By`, etc.) em commits, código ou PRs.
  - 100% dos testes aprovados na suíte de testes.
