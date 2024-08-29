import { z } from 'zod';

// Sub-schemas
const JournalMetaSchema = z.object({
  nlmTa: z.string().optional(), // #PCDATA: Parsed character data, can contain text
  issn: z.array(
    z.object({
      issnType: z.enum(['print', 'electronic', 'linking']),
      value: z.string(), // #PCDATA: Parsed character data, can contain text
    }),
  ),
  journalTitle: z.string().optional(), // #PCDATA: Parsed character data, can contain text
});

const PubDateSchema = z.object({
  pubDateType: z.enum(['issue', 'article']),
  day: z.string().optional(), // #PCDATA: Parsed character data, can contain text
  month: z.string().optional(), // #PCDATA: Parsed character data, can contain text
  season: z.string().optional(), // #PCDATA: Parsed character data, can contain text
  year: z.string(), // #PCDATA: Parsed character data, can contain text
});

const CitationSchema = z.object({
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

const PersonSchema = z.object({
  fname: z.string(), // #PCDATA: Parsed character data, can contain text
  mname: z.string().optional(), // #PCDATA: Parsed character data, can contain text
  lname: z.string(), // #PCDATA: Parsed character data, can contain text
  email: z.string(), // #PCDATA: Parsed character data, can contain text
  personType: z.enum(['author', 'reviewer']),
});

const ContactsSchema = z.object({
  person: z.array(PersonSchema),
});

const PISchema = z.object({
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

const GrantsSchema = z.object({
  grant: z.array(GrantSchema),
});

const PermissionsSchema = z.object({
  copyrightStatement: z.string().optional(), // #PCDATA: Parsed character data, can contain text
});

const CustomMetaSchema = z.object({
  name: z.string(), // #PCDATA: Parsed character data, can contain text
  content: z.string().optional(), // #PCDATA: Parsed character data, can contain text
});

const CustomMetaGroupSchema = z.object({
  customMeta: z.array(CustomMetaSchema),
});

export const DepositMetaSchema = z.object({
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

// TypeScript inferred types
export type JournalMeta = z.infer<typeof JournalMetaSchema>;
export type PubDate = z.infer<typeof PubDateSchema>;
export type Citation = z.infer<typeof CitationSchema>;
export type Person = z.infer<typeof PersonSchema>;
export type Contacts = z.infer<typeof ContactsSchema>;
export type PI = z.infer<typeof PISchema>;
export type Grant = z.infer<typeof GrantSchema>;
export type Grants = z.infer<typeof GrantsSchema>;
export type Permissions = z.infer<typeof PermissionsSchema>;
export type CustomMeta = z.infer<typeof CustomMetaSchema>;
export type CustomMetaGroup = z.infer<typeof CustomMetaGroupSchema>;
export type DepositMeta = z.infer<typeof DepositMetaSchema>;
