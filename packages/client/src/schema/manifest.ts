import { z } from 'zod';

// Schema for the 'files' array
const fileSchema = z.object({
  filename: z.string().min(1),
  kind: z.enum(['Manuscript', 'Figures']),
  label: z.string().min(1),
  path: z.string().min(1),
});

// Schema for the 'journal' object
const journalSchema = z.object({
  issn: z.string().min(1),
  title: z.string().min(1),
  shortTitle: z.string().min(1),
});

// Schema for the 'authors' array
const authorSchema = z.object({
  fname: z.string().min(1),
  mname: z.string().optional(),
  lname: z.string().min(1),
  email: z.string().email().optional(),
  contactType: z.enum(['reviewer', 'author']),
});

// Schema for the 'funding' array
const fundingSchema = z.object({
  funder: z.string().min(1),
  grantId: z.string().optional(),
});

// Schema for the 'metadata' object
const metadataSchema = z.object({
  title: z.string().min(1),
  journal: journalSchema,
  authors: z.array(authorSchema).min(1),
  funding: z.array(fundingSchema).optional(),
});

// Main manifest schema
export const AAMDepositManifestSchema = z.object({
  files: z.array(fileSchema).min(1),
  doi: z.string().min(1),
  metadata: metadataSchema,
});
