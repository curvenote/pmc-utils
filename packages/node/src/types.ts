export type Logger = Pick<typeof console, 'debug' | 'info' | 'warn' | 'error'>;
export type FetchLike = typeof fetch;
export type ILookupOptions = { fetch: FetchLike; log: Logger };
