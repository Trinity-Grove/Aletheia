import { ptBR } from './pt-BR/index';

export { ptBR };

type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };
export type Dictionary = Widen<typeof ptBR>;
