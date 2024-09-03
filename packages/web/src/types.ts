import type { ExpectedCrossrefFields } from './schema/types.js';

export * from './schema/types.js';

export type Logger = Pick<typeof console, 'debug' | 'info' | 'warn' | 'error'>;
export type FetchLike = typeof fetch;
export type IClientOptions = { fetch: FetchLike; log: Logger };

export type LookupResult = {
  doi: string;
  data: ExpectedCrossrefFields;
  missing?: string[];
};

export type UserInfo = {
  firstName: string;
  lastName: string;
  email: string;
};
