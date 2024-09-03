import { z } from 'zod';

// Sub-schemas
export const JournalMetaSchema = z.object({
  nlmTa: z.string().optional(), // #PCDATA: Parsed character data, can contain text
  issn: z.array(
    z.object({
      issnType: z.enum(['print', 'electronic', 'linking']),
      value: z.string(), // #PCDATA: Parsed character data, can contain text
    }),
  ),
  journalTitle: z.string().optional(), // #PCDATA: Parsed character data, can contain text
});

export const PubDateSchema = z.object({
  pubDateType: z.enum(['issue', 'article']),
  day: z.string().optional(), // #PCDATA: Parsed character data, can contain text
  month: z.string().optional(), // #PCDATA: Parsed character data, can contain text
  season: z.string().optional(), // #PCDATA: Parsed character data, can contain text
  year: z.string(), // #PCDATA: Parsed character data, can contain text
});

export const CitationSchema = z.object({
  pubDate: z.array(PubDateSchema),
  volume: z.string(), // #PCDATA: Parsed character data, can contain text
  issue: z.string(), // #PCDATA: Parsed character data, can contain text
  fpage: z.string().optional(), // #PCDATA: Parsed character data, can contain text
  lpage: z.string().optional(), // #PCDATA: Parsed character data, can contain text
  elocationId: z.string().optional(), // #PCDATA: Parsed character data, can contain text
  URL: z
    .array(
      z.object({
        urlType: z.enum(['citation', 'full-text']),
        value: z.string(), // #PCDATA: Parsed character data, can contain text
      }),
    )
    .optional(),
});

export const PersonSchema = z.object({
  fname: z.string(), // #PCDATA: Parsed character data, can contain text
  mname: z.string().optional(), // #PCDATA: Parsed character data, can contain text
  lname: z.string(), // #PCDATA: Parsed character data, can contain text
  email: z.string(), // #PCDATA: Parsed character data, can contain text
  personType: z.enum(['author', 'reviewer']),
});

export const ContactsSchema = z.object({
  person: z.array(PersonSchema),
});

export const PISchema = z.object({
  fname: z.string(), // #PCDATA: Parsed character data, can contain text
  lname: z.string(), // #PCDATA: Parsed character data, can contain text
  email: z.string().optional(), // #PCDATA: Parsed character data, can contain text
  center: z.string().optional(), // #PCDATA: Parsed character data, can contain text
});

export const KNOWN_FUNDERS = [
  'nih',
  'ahrq',
  'aspr',
  'cdc',
  'epa',
  'fda',
  'hhmi',
  'nasa',
  'nist',
  'va',
];
export const GrantSchema = z.object({
  id: z.string().optional(), // #PCDATA: Parsed character data, can contain text
  funder: z.enum(['nih', 'ahrq', 'aspr', 'cdc', 'epa', 'fda', 'hhmi', 'nasa', 'nist', 'va']),
  PI: PISchema.optional(),
});

export const GrantsSchema = z.object({
  grant: z.array(GrantSchema),
});

export const PermissionsSchema = z.object({
  copyrightStatement: z.string().optional(), // #PCDATA: Parsed character data, can contain text
});

export const CustomMetaSchema = z.object({
  name: z.string(), // #PCDATA: Parsed character data, can contain text
  content: z.string().optional(), // #PCDATA: Parsed character data, can contain text
});

export const CustomMetaGroupSchema = z.object({
  customMeta: z.array(CustomMetaSchema),
});

export const PMCDepositMetaSchema = z.object({
  agency: z.string().optional(), // CDATA: Character data, plain text
  manuscriptId: z.string().optional(), // CDATA: Character data, plain text
  embargoMonths: z.number().min(0).max(12).default(0),
  pmid: z.string().optional(), // CDATA: Character data, plain text
  pmcid: z.string().optional(), // CDATA: Character data, plain text
  doi: z.string().optional(), // CDATA: Character data, plain text
  journalMeta: JournalMetaSchema,
  manuscriptTitle: z.string(), // #PCDATA: Parsed character data, can contain text
  citation: CitationSchema.optional(),
  contacts: ContactsSchema,
  grants: GrantsSchema.optional(),
  permissions: PermissionsSchema.optional(),
  disclaimer: z.string().optional(), // #PCDATA: Parsed character data, can contain text
  customMetaGroup: CustomMetaGroupSchema.optional(),
});
