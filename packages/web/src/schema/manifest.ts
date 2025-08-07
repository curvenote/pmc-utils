import { z } from 'zod';

// Schema for the 'files' array
const fileSchema = z.object({
  filename: z.string().min(1),
  type: z.enum(['manuscript', 'figure', 'table', 'supplement']),
  label: z.string().min(1),
  storage: z.enum(['bucket', 'local']).default('bucket'),
  path: z.string().min(1),
  contentType: z.string().optional(),
});

// Schema for the 'journal' object
const journalSchema = z.object({
  issn: z.string().min(1),
  issnType: z.enum(['print', 'electronic']),
  title: z.string().min(1),
  shortTitle: z.string().optional(),
});

// Schema for the 'authors' array
const authorSchema = z.object({
  fname: z.string().min(1),
  mname: z.string().optional(),
  lname: z.string().min(1),
  email: z.string().email(),
  contactType: z.enum(['reviewer', 'author']),
});

// Schema for the 'grants' array
const grantSchema = z.object({
  funder: z.string().min(1),
  id: z.string().optional(),
});

// Schema for the 'metadata' object
const metadataSchema = z.object({
  title: z.string().min(1),
  journal: journalSchema,
  authors: z.array(authorSchema).min(1),
  grants: z.array(grantSchema),
});

// Main manifest schema
export const AAMDepositManifestSchema = z.object({
  taskId: z.string().min(1),
  agency: z.string().min(1).default('hhmi'),
  files: z.array(fileSchema).min(1),
  doi: z.string().optional(),
  metadata: metadataSchema,
});
