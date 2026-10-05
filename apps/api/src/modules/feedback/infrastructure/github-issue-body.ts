import type { FeedbackCategory } from '@aletheia/contracts';

// GitHub label per category, applied automatically on every approved
// feedback ("feedback" itself is always added by the caller, which lets
// the admin edit the list before approving). These are the labels the
// repository actually carries, so an approved story is searchable with
// the same terms the team already uses on GitHub itself.
export const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  BUG: 'bug',
  IDEA: 'enhancement',
  QUESTION: 'question',
  PRAISE: 'praise',
};

// What the issue body says, which is not the label: pt-BR, because the
// issue is read by the Brazilian team triaging it.
const CATEGORY_HEADINGS: Record<FeedbackCategory, string> = {
  BUG: 'Bug',
  IDEA: 'Ideia',
  QUESTION: 'Pergunta',
  PRAISE: 'Elogio',
};

const MARKER_PREFIX = 'aletheia-feedback-id';
const UUID = '[0-9a-fA-F-]{36}';

export function buildFeedbackMarker(feedbackId: string): string {
  return `<!-- ${MARKER_PREFIX}: ${feedbackId} -->`;
}

export function extractFeedbackMarker(body: string): string | null {
  const match = body.match(new RegExp(`<!--\\s*${MARKER_PREFIX}:\\s*(${UUID})\\s*-->`));
  return match?.[1] ?? null;
}

// HTML-escape, in this exact order, so `&` is not double-decoded. This is
// what stops a message containing "<!-- aletheia-feedback-id: ... -->" from
// forging another submission's marker and hijacking its approval. Markdown
// emphasis characters are deliberately left alone: the text is prose meant
// to read as the person wrote it.
export function escapeMarkdownText(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export interface BuildIssueBodyParams {
  feedbackId: string;
  category: FeedbackCategory;
  createdAt: string;
  locale: string | null;
  pagePath: string | null;
  appVersion: string | null;
  message: string;
  adminNote: string | null;
  identifySelf: boolean;
  submitterName: string | null;
  submitterEmail: string | null;
}

// Every value that came from the submitter (message, pagePath, locale,
// appVersion, name, email) and the admin's note go through
// escapeMarkdownText: they all land in the same body the marker is read
// back out of, so an unescaped `<!-- aletheia-feedback-id: ... -->` in any
// of them would forge another submission's marker -- the message is not
// the only door into that. createdAt and the category heading are our own
// values (a timestamp and a lookup in CATEGORY_HEADINGS), so they are
// written as-is.
export function buildIssueBody(params: BuildIssueBodyParams): string {
  const lines: string[] = [
    buildFeedbackMarker(params.feedbackId),
    `**Categoria:** ${CATEGORY_HEADINGS[params.category]}`,
  ];

  if (params.locale) {
    lines.push(
      `**Relatado em:** ${escapeMarkdownText(params.createdAt)} · ${escapeMarkdownText(
        params.locale,
      )}`,
    );
  }
  if (params.pagePath) {
    lines.push(`**Página:** ${escapeMarkdownText(params.pagePath)}`);
  }
  if (params.appVersion) {
    lines.push(`**Versão:** ${escapeMarkdownText(params.appVersion)}`);
  }

  lines.push('', escapeMarkdownText(params.message));

  if (params.adminNote) {
    lines.push(
      '',
      '---',
      '### Contexto do time (administração)',
      escapeMarkdownText(params.adminNote),
    );
  }

  if (params.identifySelf) {
    const name = escapeMarkdownText(params.submitterName ?? '(nome não informado)');
    const email = escapeMarkdownText(params.submitterEmail ?? '(sem e-mail)');
    lines.push('', '---', `**Reportado por:** ${name} (${email})`);
  }

  return lines.join('\n');
}