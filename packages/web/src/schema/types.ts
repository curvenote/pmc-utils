import type { z } from 'zod';
import type { AAMDepositManifestSchema } from './manifest.js';
import type { ExpectedCrossrefFieldsSchema } from './crossref.js';
import type { KNOWN_FUNDERS, KNOWN_ISSN_TYPE, KNOWN_PERSONTYPE } from './pmc.js';

export type PMCPersonType = (typeof KNOWN_PERSONTYPE)[number];
export type PMCFunder = (typeof KNOWN_FUNDERS)[number];
export type PMCISSNType = (typeof KNOWN_ISSN_TYPE)[number];
export type AAMDepositManifest = z.infer<typeof AAMDepositManifestSchema>;
export type ExpectedCrossrefFields = z.infer<typeof ExpectedCrossrefFieldsSchema>;
