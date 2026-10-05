import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from './config.service.js';
import type { GithubIssueGateway as GithubIssueGatewayContract } from './github-issue.gateway.interface.js';

const GITHUB_API_BASE = 'https://api.github.com';

// Real GitHub REST integration, mirroring how MercadoPagoDonationGateway
// talks to Mercado Pago: the global `fetch`, no new dependency. Every
// failure is rethrown as `GitHub <status>: <upstream body>` because the
// status in that string is what the approval flow records in
// `lastIssueError` -- an operator needs to tell "bad token" (401) from
// "rate limited" (403) from "repo not found" (404) at a glance.
// The port and this class deliberately share one name: `GithubIssueGateway`
// is what callers inject, and this is the only real implementation of it,
// so a caller reading `toBeInstanceOf(GithubIssueGateway)` sees the same
// word on both sides. The port is aliased on import because TypeScript
// refuses to merge an imported declaration with the exported class.
@Injectable()
export class GithubIssueGateway implements GithubIssueGatewayContract {
  private readonly logger = new Logger(GithubIssueGateway.name);

  constructor(@Optional() private readonly config?: ConfigService) {}

  private read(key: string): string | undefined {
    return this.config?.get(key) ?? process.env[key];
  }

  // Read per call, not once in the constructor: the factory already
  // refuses to build this gateway without a token, and reading again here
  // means a token rotated into the environment is picked up without
  // needing a second process.
  private token(): string {
    const token = this.read('GITHUB_TOKEN');
    if (!token) {
      throw new Error(
        'GITHUB_TOKEN is required to talk to the GitHub API. Refusing to send an unauthenticated request.',
      );
    }
    return token;
  }

  private headers(): Record<string, string> {
    return {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      Authorization: `Bearer ${this.token()}`,
    };
  }

  private repo(): string {
    const owner = this.read('GITHUB_REPO_OWNER') ?? 'Trinity-Grove';
    const repo = this.read('GITHUB_REPO_NAME') ?? 'Aletheia';
    return `${owner}/${repo}`;
  }

  private base(): string {
    return `${GITHUB_API_BASE}/repos/${this.repo()}`;
  }

  private async request<T>(url: string, init: RequestInit): Promise<T> {
    const response = await fetch(url, init);

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`GitHub ${init.method ?? 'GET'} ${url} failed: ${response.status} ${body}`);
      throw new Error(`GitHub ${response.status}: ${body}`);
    }

    return (await response.json()) as T;
  }

  async createIssue(params: {
    title: string;
    body: string;
    labels: string[];
  }): Promise<{ number: number; url: string }> {
    const data = await this.request<{ number: number; html_url: string }>(
      `${this.base()}/issues`,
      {
        method: 'POST',
        headers: {
          ...this.headers(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: params.title,
          body: params.body,
          labels: params.labels,
        }),
      },
    );

    return { number: data.number, url: data.html_url };
  }

  async findIssueByMarker(marker: string): Promise<{ number: number; url: string } | null> {
    // GitHub's search API matches on the indexable body text, and the
    // marker survives that (it is an HTML comment in the body, kept
    // verbatim by the API). Quoting the term keeps the search from
    // reading the colon/dashes as query operators. The prefix below must
    // stay identical to MARKER_PREFIX in github-issue-body.ts -- that is
    // the string the body builder writes and extractFeedbackMarker reads.
    const query = `"aletheia-feedback-id: ${marker}" in:body repo:${this.repo()} is:issue`;
    const url = `${GITHUB_API_BASE}/search/issues?q=${encodeURIComponent(query)}&per_page=5`;

    const data = await this.request<{
      items?: Array<{ number: number; html_url: string }>;
    }>(url, { method: 'GET', headers: this.headers() });

    const first = data.items?.[0];
    return first ? { number: first.number, url: first.html_url } : null;
  }
}