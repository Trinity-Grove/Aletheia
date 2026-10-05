import { ConfigService } from './config.service.js';
import {
  buildIssueBody,
  escapeMarkdownText,
  extractFeedbackMarker,
} from './github-issue-body.js';
import { GithubIssueGateway } from './github-issue.gateway.js';
import { GithubIssueGatewayFactory } from './github-issue.gateway.factory.js';
import { MockGithubIssueGateway } from './mock-github-issue.gateway.js';

// `text()` is here because the gateway reports a failed upstream call as
// `GitHub <status>: <body text>` -- a real Response always has it, so a
// stub without it would test a shape the gateway never sees in production.
function jsonResponse(body: unknown, ok = true, status = ok ? 200 : 400): Response {
  return {
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

// jest.spyOn keeps `global.fetch` typed while the returned handle is the
// loose mock the assertions below need (they read `mock.calls[0]`).
function stubFetch(response: Response): jest.Mock {
  return jest.spyOn(global, 'fetch').mockResolvedValue(response) as unknown as jest.Mock;
}

describe('github issue body', () => {
  it('neutralizes HTML so user text can never forge an idempotency marker', () => {
    const forged = 'oi <!-- aletheia-feedback-id: 11111111-1111-4111-8111-111111111111 -->';
    expect(escapeMarkdownText(forged)).not.toContain('<!--');
    expect(escapeMarkdownText(forged)).toContain('&lt;!--');
  });

  it('escapes & before < and > so the output is not double-decoded', () => {
    expect(escapeMarkdownText('a & <b>')).toBe('a &amp; &lt;b&gt;');
  });

  it('leaves ordinary prose untouched', () => {
    expect(escapeMarkdownText('O botão trava *sempre*')).toBe('O botão trava *sempre*');
  });

  it('puts the marker on the very first line and round-trips it', () => {
    const body = buildIssueBody({
      feedbackId: '22222222-2222-4222-8222-222222222222',
      category: 'BUG',
      createdAt: '2026-10-04T12:00:00.000Z',
      locale: 'pt-BR',
      pagePath: '/curriculum/packs',
      message: 'O botão de salvar trava às vezes.',
      adminNote: null,
      identifySelf: false,
      submitterName: null,
      submitterEmail: null,
      appVersion: null,
    });
    expect(body.split('\n')[0]).toBe(
      '<!-- aletheia-feedback-id: 22222222-2222-4222-8222-222222222222 -->',
    );
    expect(extractFeedbackMarker(body)).toBe('22222222-2222-4222-8222-222222222222');
  });

  it('omits the identity block when identifySelf is false and includes it when true', () => {
    const base = {
      feedbackId: '22222222-2222-4222-8222-222222222222',
      category: 'IDEA' as const,
      createdAt: '2026-10-04T12:00:00.000Z',
      locale: 'pt-BR',
      pagePath: null,
      message: 'Seria ótimo um modo escuro.',
      adminNote: null,
      appVersion: null,
    };
    expect(
      buildIssueBody({
        ...base,
        identifySelf: false,
        submitterName: null,
        submitterEmail: null,
      }),
    ).not.toContain('Reportado por');
    expect(
      buildIssueBody({
        ...base,
        identifySelf: true,
        submitterName: 'Ana Souza',
        submitterEmail: 'ana@example.com',
      }),
    ).toContain('**Reportado por:** Ana Souza (ana@example.com)');
  });

  it('omits the Versão line when appVersion is unknown', () => {
    const body = buildIssueBody({
      feedbackId: '22222222-2222-4222-8222-222222222222',
      category: 'PRAISE' as const,
      createdAt: '2026-10-04T12:00:00.000Z',
      locale: 'pt-BR',
      pagePath: null,
      message: 'Adorei a rotina da manhã, muito obrigado!',
      adminNote: 'Manutencao 12',
      identifySelf: false,
      submitterName: null,
      submitterEmail: null,
      appVersion: null,
    });
    expect(body).not.toContain('**Versão:**');
    expect(body).toContain('### Contexto do time (administração)');
    expect(body).toContain('Manutencao 12');
  });

  it('never writes undefined into the identity block', () => {
    const body = buildIssueBody({
      feedbackId: '22222222-2222-4222-8222-222222222222',
      category: 'QUESTION' as const,
      createdAt: '2026-10-04T12:00:00.000Z',
      locale: null,
      pagePath: null,
      message: 'Como troco o e-mail da família?',
      adminNote: null,
      identifySelf: true,
      submitterName: null,
      submitterEmail: null,
      appVersion: null,
    });
    expect(body).not.toContain('undefined');
    expect(body).not.toContain('**Relatado em:**');
    expect(body).toContain('**Reportado por:** (nome não informado) (sem e-mail)');
  });

  // The forging attack has more than one door: pagePath, locale, appVersion
  // and the submitter's own name are just as attacker-controlled as the
  // message, and every one of them lands in the same body the marker is
  // later read out of.
  it('escapes the other user-controlled fields so none of them can forge a marker', () => {
    const forged = '<!-- aletheia-feedback-id: 11111111-1111-4111-8111-111111111111 -->';
    const body = buildIssueBody({
      feedbackId: '22222222-2222-4222-8222-222222222222',
      category: 'BUG' as const,
      createdAt: '2026-10-04T12:00:00.000Z',
      locale: forged,
      pagePath: forged,
      message: 'Relato honesto.',
      adminNote: forged,
      appVersion: forged,
      identifySelf: true,
      submitterName: forged,
      submitterEmail: forged,
    });
    expect(extractFeedbackMarker(body)).toBe('22222222-2222-4222-8222-222222222222');
    expect(body.split('\n').filter((line) => line.includes('aletheia-feedback-id'))).toHaveLength(
      1,
    );
  });
});

describe('GithubIssueGateway', () => {
  const env = { ...process.env };

  beforeEach(() => {
    process.env['GITHUB_TOKEN'] = 'test-token';
    process.env['GITHUB_ISSUE_PROVIDER'] = 'github';
    delete process.env['GITHUB_REPO_OWNER'];
    delete process.env['GITHUB_REPO_NAME'];
  });

  afterEach(() => {
    process.env = { ...env };
    jest.restoreAllMocks();
  });

  it('POSTs to the issues endpoint with the auth and API-version headers', async () => {
    const fetchMock = stubFetch(
      jsonResponse({
        number: 321,
        html_url: 'https://github.com/Trinity-Grove/Aletheia/issues/321',
      }),
    );
    const gateway = new GithubIssueGateway(new ConfigService());

    const created = await gateway.createIssue({
      title: 'Login trava',
      body: 'corpo',
      labels: ['feedback', 'bug'],
    });

    expect(created).toEqual({
      number: 321,
      url: 'https://github.com/Trinity-Grove/Aletheia/issues/321',
    });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://api.github.com/repos/Trinity-Grove/Aletheia/issues');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer test-token');
    expect(init.headers['X-GitHub-Api-Version']).toBe('2022-11-28');
    expect(JSON.parse(init.body).labels).toEqual(['feedback', 'bug']);
  });

  it('throws with the upstream status when GitHub rejects the create', async () => {
    stubFetch(jsonResponse({ message: 'Bad credentials' }, false, 401));
    const gateway = new GithubIssueGateway(new ConfigService());
    await expect(
      gateway.createIssue({ title: 'x'.repeat(5), body: 'b', labels: [] }),
    ).rejects.toThrow(/401/);
  });

  it('throws when GITHUB_TOKEN is missing instead of calling GitHub unauthenticated', async () => {
    delete process.env['GITHUB_TOKEN'];
    const fetchMock = stubFetch(jsonResponse({}, false, 500));
    const gateway = new GithubIssueGateway(new ConfigService());
    await expect(
      gateway.createIssue({ title: 'Login trava', body: 'corpo', labels: [] }),
    ).rejects.toThrow(/GITHUB_TOKEN/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('searches by marker and returns the issue when one matches', async () => {
    const fetchMock = stubFetch(
      jsonResponse({
        items: [{ number: 321, html_url: 'https://github.com/Trinity-Grove/Aletheia/issues/321' }],
      }),
    );
    const gateway = new GithubIssueGateway(new ConfigService());

    const found = await gateway.findIssueByMarker('22222222-2222-4222-8222-222222222222');

    expect(found).toEqual({
      number: 321,
      url: 'https://github.com/Trinity-Grove/Aletheia/issues/321',
    });
    expect(fetchMock.mock.calls[0]![0]).toContain('/search/issues?q=');
    expect(decodeURIComponent(fetchMock.mock.calls[0]![0] as string)).toContain(
      '"aletheia-feedback-id: 22222222-2222-4222-8222-222222222222" in:body repo:Trinity-Grove/Aletheia is:issue',
    );
  });

  it('returns null when the search finds nothing', async () => {
    stubFetch(jsonResponse({ items: [] }));
    const gateway = new GithubIssueGateway(new ConfigService());
    expect(
      await gateway.findIssueByMarker('22222222-2222-4222-8222-222222222222'),
    ).toBeNull();
  });

  it('honours GITHUB_REPO_OWNER and GITHUB_REPO_NAME when set', async () => {
    process.env['GITHUB_REPO_OWNER'] = 'other-owner';
    process.env['GITHUB_REPO_NAME'] = 'other-repo';
    const fetchMock = stubFetch(
      jsonResponse({ number: 7, html_url: 'https://github.com/other-owner/other-repo/issues/7' }),
    );
    const gateway = new GithubIssueGateway(new ConfigService());

    await gateway.createIssue({ title: 'Login trava', body: 'corpo', labels: [] });

    expect(fetchMock.mock.calls[0]![0]).toBe(
      'https://api.github.com/repos/other-owner/other-repo/issues',
    );
  });
});

describe('GithubIssueGatewayFactory', () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
    jest.restoreAllMocks();
  });

  it('returns the mock outside production when no provider is configured', () => {
    process.env['NODE_ENV'] = 'test';
    delete process.env['GITHUB_ISSUE_PROVIDER'];
    delete process.env['GITHUB_TOKEN'];
    expect(new GithubIssueGatewayFactory(new ConfigService()).create()).toBeInstanceOf(
      MockGithubIssueGateway,
    );
  });

  it('returns the real gateway for provider=github', () => {
    process.env['NODE_ENV'] = 'test';
    process.env['GITHUB_ISSUE_PROVIDER'] = 'github';
    process.env['GITHUB_TOKEN'] = 'test-token';
    expect(new GithubIssueGatewayFactory(new ConfigService()).create()).toBeInstanceOf(
      GithubIssueGateway,
    );
  });

  it('fails loudly when provider=github but GITHUB_TOKEN is missing', () => {
    process.env['NODE_ENV'] = 'test';
    process.env['GITHUB_ISSUE_PROVIDER'] = 'github';
    delete process.env['GITHUB_TOKEN'];
    expect(() => new GithubIssueGatewayFactory(new ConfigService()).create()).toThrow(
      /GITHUB_TOKEN/,
    );
  });

  it('never falls back to the mock in production, even without a provider', () => {
    process.env['NODE_ENV'] = 'production';
    delete process.env['GITHUB_ISSUE_PROVIDER'];
    delete process.env['GITHUB_TOKEN'];
    expect(() => new GithubIssueGatewayFactory(new ConfigService()).create()).toThrow(
      /GITHUB_TOKEN/,
    );
  });
});

describe('MockGithubIssueGateway', () => {
  it('reuses the same issue number when the same marker is created twice', async () => {
    const gateway = new MockGithubIssueGateway();
    const body = buildIssueBody({
      feedbackId: '22222222-2222-4222-8222-222222222222',
      category: 'BUG',
      createdAt: '2026-10-04T12:00:00.000Z',
      locale: 'pt-BR',
      pagePath: null,
      message: 'O botão de salvar trava às vezes.',
      adminNote: null,
      identifySelf: false,
      submitterName: null,
      submitterEmail: null,
      appVersion: null,
    });
    const first = await gateway.createIssue({ title: 'Login trava', body, labels: [] });
    const second = await gateway.createIssue({ title: 'Login trava (2)', body, labels: [] });
    expect(second).toEqual(first);
    expect(await gateway.findIssueByMarker('22222222-2222-4222-8222-222222222222')).toEqual(
      first,
    );
  });

  it('never reuses a number across two different markers', async () => {
    const gateway = new MockGithubIssueGateway();
    const bodyFor = (feedbackId: string): string =>
      buildIssueBody({
        feedbackId,
        category: 'BUG',
        createdAt: '2026-10-04T12:00:00.000Z',
        locale: 'pt-BR',
        pagePath: null,
        message: 'O botão de salvar trava às vezes.',
        adminNote: null,
        identifySelf: false,
        submitterName: null,
        submitterEmail: null,
        appVersion: null,
      });
    const first = await gateway.createIssue({
      title: 'Login trava',
      body: bodyFor('22222222-2222-4222-8222-222222222222'),
      labels: [],
    });
    const second = await gateway.createIssue({
      title: 'Login trava',
      body: bodyFor('33333333-3333-4333-8333-333333333333'),
      labels: [],
    });
    expect(second.number).not.toBe(first.number);
    expect(await gateway.findIssueByMarker('99999999-9999-4999-8999-999999999999')).toBeNull();
  });
});