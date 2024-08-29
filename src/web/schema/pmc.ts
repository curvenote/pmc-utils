import { z } from 'zod';

// Sub-schemas
const JournalMetaSchema = z.object({
  'nlm-ta': z.string().optional(), // #PCDATA: Parsed character data, can contain text
  issn: z.array(
    z.object({
      'issn-type': z.enum(['print', 'electronic', 'linking']),
      value: z.string(), // #PCDATA: Parsed character data, can contain text
    }),
  ),
  'journal-title': z.string().optional(), // #PCDATA: Parsed character data, can contain text
});

const PubDateSchema = z.object({
  'pub-date-type': z.enum(['issue', 'article']),
  day: z.string().optional(), // #PCDATA: Parsed character data, can contain text
  month: z.string().optional(), // #PCDATA: Parsed character data, can contain text
  season: z.string().optional(), // #PCDATA: Parsed character data, can contain text
  year: z.string(), // #PCDATA: Parsed character data, can contain text
});

const CitationSchema = z.object({
  'pub-date': z.array(PubDateSchema),
  volume: z.string(), // #PCDATA: Parsed character data, can contain text
  issue: z.string(), // #PCDATA: Parsed character data, can contain text
  fpage: z.string().optional(), // #PCDATA: Parsed character data, can contain text
  lpage: z.string().optional(), // #PCDATA: Parsed character data, can contain text
  'elocation-id': z.string().optional(), // #PCDATA: Parsed character data, can contain text
  URL: z
    .array(
      z.object({
        'url-type': z.enum(['citation', 'full-text']),
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
  'person-type': z.enum(['author', 'reviewer']),
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

const GrantSchema = z.object({
  id: z.string().optional(), // #PCDATA: Parsed character data, can contain text
  funder: z.enum(['nih', 'ahrq', 'aspr', 'cdc', 'epa', 'fda', 'hhmi', 'nasa', 'nist', 'va']),
  PI: PISchema.optional(),
});

const GrantsSchema = z.object({
  grant: z.array(GrantSchema),
});

const PermissionsSchema = z.object({
  'copyright-statement': z.string().optional(), // #PCDATA: Parsed character data, can contain text
});

const CustomMetaSchema = z.object({
  name: z.string(), // #PCDATA: Parsed character data, can contain text
  content: z.string().optional(), // #PCDATA: Parsed character data, can contain text
});

const CustomMetaGroupSchema = z.object({
  'custom-meta': z.array(CustomMetaSchema),
});

export const DepositMetaSchema = z.object({
  agency: z.string().optional(), // CDATA: Character data, plain text
  'manuscript-id': z.string().optional(), // CDATA: Character data, plain text
  'embargo-months': z
    .enum(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'])
    .default('0'),
  pmid: z.string().optional(), // CDATA: Character data, plain text
  pmcid: z.string().optional(), // CDATA: Character data, plain text
  doi: z.string().optional(), // CDATA: Character data, plain text
  'xmlns:xlink': z.string().default('http://www.w3.org/1999/xlink'),
  'journal-meta': JournalMetaSchema,
  'manuscript-title': z.string(), // #PCDATA: Parsed character data, can contain text
  citation: CitationSchema.optional(),
  contacts: ContactsSchema,
  grants: GrantsSchema.optional(),
  permissions: PermissionsSchema.optional(),
  disclaimer: z.string().optional(), // #PCDATA: Parsed character data, can contain text
  'custom-meta-group': CustomMetaGroupSchema.optional(),
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
