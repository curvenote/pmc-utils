import type { z } from 'zod';
import type { PMCDepositMetaSchema, GrantSchema, ISSNSchema } from './pmc.js';
import type { AAMDepositManifestSchema } from './manifest.js';
import type { ExpectedCrossrefFieldsSchema } from './crossref.js';

export type PMCDepositMeta = z.infer<typeof PMCDepositMetaSchema>;
export type PMCJournalMeta = PMCDepositMeta['journalMeta'];
export type PMCDepositGrant = z.infer<typeof GrantSchema>;
export type PMCISSN = z.infer<typeof ISSNSchema>;
export type AAMDepositManifest = z.infer<typeof AAMDepositManifestSchema>;
export type ExpectedCrossrefFields = z.infer<typeof ExpectedCrossrefFieldsSchema>;
