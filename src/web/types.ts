import type { ExpectedCrossrefFields } from './schema/crossref.js';

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
