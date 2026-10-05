import { Injectable } from '@nestjs/common';
import { extractFeedbackMarker } from './github-issue-body.js';
import type { GithubIssueGateway } from './github-issue.gateway.interface.js';

// In-memory stand-in for the GitHub gateway. It mirrors the real
// gateway's one behaviour that matters for correctness: it keys issues by
// the marker in the body, so a retried approval reuses the same number
// instead of opening a duplicate. A test that passes against this mock is
// proving the idempotency path, not just that something was returned.
@Injectable()
export class MockGithubIssueGateway implements GithubIssueGateway {
  private readonly issues = new Map<string, { number: number; url: string }>();
  // Starts at 900 so a mock number can never collide with a real GitHub
  // issue number a test happens to hardcode.
  private nextNumber = 900;

  async createIssue(params: {
    title: string;
    body: string;
    labels: string[];
  }): Promise<{ number: number; url: string }> {
    const marker = extractFeedbackMarker(params.body);

    if (marker) {
      const existing = this.issues.get(marker);
      if (existing) return existing;
    }

    this.nextNumber += 1;
    const issue = {
      number: this.nextNumber,
      url: `https://github.com/Trinity-Grove/Aletheia/issues/${this.nextNumber}`,
    };
    // Only a body carrying a marker can ever be found again, so only that
    // one is worth remembering.
    if (marker) this.issues.set(marker, issue);

    return issue;
  }

  async findIssueByMarker(marker: string): Promise<{ number: number; url: string } | null> {
    return this.issues.get(marker) ?? null;
  }
}