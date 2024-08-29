import type { ExpectedCrossrefFields } from './schema/crossref.js';

export type LookupResult = { data: Partial<ExpectedCrossrefFields>; missing: string[] };
