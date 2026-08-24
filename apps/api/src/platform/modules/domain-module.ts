export const DOMAIN_MODULE = Symbol('DOMAIN_MODULE');

export interface DomainModuleDescriptor {
  readonly name: string;
  readonly publicExports: readonly string[];
}
