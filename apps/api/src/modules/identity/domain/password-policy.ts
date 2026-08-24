export class PasswordPolicy {
  private static readonly MIN_LENGTH = 8;

  static validate(password: string): { valid: boolean; reason?: string } {
    if (!password || password.length < this.MIN_LENGTH) {
      return {
        valid: false,
        reason: `Password must be at least ${this.MIN_LENGTH} characters long.`,
      };
    }
    return { valid: true };
  }
}
