import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  get<T = string>(key: string): T | undefined {
    return (process.env[key] as unknown as T) ?? undefined;
  }
}
