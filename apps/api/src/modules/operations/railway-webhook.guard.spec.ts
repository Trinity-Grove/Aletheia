import * as crypto from 'node:crypto';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { RailwayWebhookGuard } from './railway-webhook.guard.js';

describe('RailwayWebhookGuard', () => {
  let guard: RailwayWebhookGuard;
  const originalEnv = process.env.RAILWAY_WEBHOOK_SECRET;
  const SECRET = 'test-railway-webhook-secret-12345';

  beforeEach(() => {
    guard = new RailwayWebhookGuard();
    process.env.RAILWAY_WEBHOOK_SECRET = SECRET;
  });

  afterEach(() => {
    process.env.RAILWAY_WEBHOOK_SECRET = originalEnv;
  });

  function createMockContext(headers: Record<string, string | undefined>, body: unknown = {}): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers,
          body,
        }),
      }),
    } as unknown as ExecutionContext;
  }

  it('throws UnauthorizedException when RAILWAY_WEBHOOK_SECRET is not configured', () => {
    delete process.env.RAILWAY_WEBHOOK_SECRET;
    const context = createMockContext({ 'x-railway-secret': SECRET });

    expect(() => guard.canActivate(context)).toThrow(
      new UnauthorizedException('Railway webhook secret is not configured.'),
    );
  });

  it('allows request when x-railway-secret matches configured secret', () => {
    const context = createMockContext({ 'x-railway-secret': SECRET });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows request when x-railway-signature matches configured secret directly', () => {
    const context = createMockContext({ 'x-railway-signature': SECRET });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows request when x-railway-signature matches computed HMAC-SHA256 (raw hex)', () => {
    const body = { type: 'DEPLOY', deployment: { status: 'SUCCESS' } };
    const hmac = crypto.createHmac('sha256', SECRET).update(JSON.stringify(body)).digest('hex');
    const context = createMockContext({ 'x-railway-signature': hmac }, body);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows request when x-railway-signature matches computed HMAC-SHA256 with sha256= prefix', () => {
    const body = { type: 'DEPLOY', deployment: { status: 'CRASHED' } };
    const hmac = crypto.createHmac('sha256', SECRET).update(JSON.stringify(body)).digest('hex');
    const context = createMockContext({ 'x-railway-signature': `sha256=${hmac}` }, body);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws UnauthorizedException when no auth headers are provided', () => {
    const context = createMockContext({});

    expect(() => guard.canActivate(context)).toThrow(
      new UnauthorizedException('Invalid Railway webhook credentials.'),
    );
  });

  it('throws UnauthorizedException when x-railway-secret is incorrect', () => {
    const context = createMockContext({ 'x-railway-secret': 'wrong-secret' });

    expect(() => guard.canActivate(context)).toThrow(
      new UnauthorizedException('Invalid Railway webhook credentials.'),
    );
  });

  it('throws UnauthorizedException when x-railway-signature HMAC is incorrect', () => {
    const body = { type: 'DEPLOY' };
    const context = createMockContext({ 'x-railway-signature': '00000000000000000000000000000000' }, body);

    expect(() => guard.canActivate(context)).toThrow(
      new UnauthorizedException('Invalid Railway webhook credentials.'),
    );
  });
});
