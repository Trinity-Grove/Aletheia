import * as crypto from 'node:crypto';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

@Injectable()
export class RailwayWebhookGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const secret = process.env.RAILWAY_WEBHOOK_SECRET;
    if (!secret) {
      throw new UnauthorizedException('Railway webhook secret is not configured.');
    }

    const request = context.switchToHttp().getRequest();
    const headers = request.headers ?? {};

    const headerSecret = headers['x-railway-secret'];
    const headerSignature = headers['x-railway-signature'];

    const xRailwaySecret =
      typeof headerSecret === 'string'
        ? headerSecret
        : Array.isArray(headerSecret)
          ? headerSecret[0]
          : undefined;

    const xRailwaySignature =
      typeof headerSignature === 'string'
        ? headerSignature
        : Array.isArray(headerSignature)
          ? headerSignature[0]
          : undefined;

    if (xRailwaySecret && timingSafeEqual(xRailwaySecret, secret)) {
      return true;
    }

    if (xRailwaySignature && timingSafeEqual(xRailwaySignature, secret)) {
      return true;
    }

    if (xRailwaySignature) {
      let bodyString = '';
      if (typeof request.body === 'string') {
        bodyString = request.body;
      } else if (Buffer.isBuffer(request.body)) {
        bodyString = request.body.toString('utf8');
      } else if (request.body !== undefined && request.body !== null) {
        bodyString = JSON.stringify(request.body);
      }

      const computedHmac = crypto
        .createHmac('sha256', secret)
        .update(bodyString)
        .digest('hex');

      const cleanSignature = xRailwaySignature.startsWith('sha256=')
        ? xRailwaySignature.slice(7)
        : xRailwaySignature;

      if (timingSafeEqual(cleanSignature, computedHmac)) {
        return true;
      }

      if (timingSafeEqual(xRailwaySignature, `sha256=${computedHmac}`)) {
        return true;
      }
    }

    throw new UnauthorizedException('Invalid Railway webhook credentials.');
  }
}
