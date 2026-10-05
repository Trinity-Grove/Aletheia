export interface GithubIssueGateway {
  createIssue(params: {
    title: string;
    body: string;
    labels: string[];
  }): Promise<{ number: number; url: string }>;

  // Used before every create: the GitHub call happens BEFORE the database
  // write (a Prisma transaction cannot be held open across network I/O),
  // so a partial failure leaves an issue with no row pointing at it. The
  // marker in the body is what makes the retry reuse instead of duplicate.
  findIssueByMarker(marker: string): Promise<{ number: number; url: string } | null>;
}

export const GITHUB_ISSUE_GATEWAY = Symbol('GITHUB_ISSUE_GATEWAY');