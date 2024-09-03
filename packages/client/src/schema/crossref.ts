import { z } from 'zod';

// Define fractional schemas
export const datePartsSchema = z.array(z.array(z.number())).min(1, 'Publication date is required');

export const publishedOnlineSchema = z.object({
  'date-parts': datePartsSchema,
});

export const publishedPrintSchema = z.object({
  'date-parts': datePartsSchema,
});

export const issnSchema = z.array(z.string().regex(/^\d{4}-\d{3}[\dxX]$/, 'Invalid ISSN format'));

export const issnTypeSchema = z.array(
  z.object({
    value: z.string().regex(/^\d{4}-\d{3}[\dxX]$/, 'Invalid ISSN format'),
    type: z.enum(['print', 'electronic', 'linking']),
  }),
);

export const titleSchema = z.array(z.string());

export const shortContainerTitleSchema = z.array(z.string());

export const containerTitleSchema = z.array(z.string());

export const authorSchema = z.array(
  z.object({
    sequence: z.enum(['first', 'additional']),
    given: z.string().min(1, 'First name is required'),
    family: z.string().min(1, 'Surname is required'),
    name: z.string().optional(),
    prefix: z.string().optional(),
    suffix: z.string().optional(),
    affiliation: z.array(z.object({ name: z.string() })).optional(),
    ORCID: z.string().optional(),
    'authenticated-orcid': z.boolean().optional(),
  }),
);

export const funderSchema = z.array(
  z.object({
    name: z.string().min(1, 'Funder name is required'),
    DOI: z.string().optional(),
    award: z.array(z.string()).optional(),
  }),
);

export const urlSchema = z.string().url();

export const ExpectedCrossrefFieldsSchema = z.object({
  title: titleSchema,
  ISSN: issnSchema,
  'issn-type': issnTypeSchema,
  'container-title': containerTitleSchema,
  'short-container-title': shortContainerTitleSchema,
  author: authorSchema,
  'published-online': publishedOnlineSchema.optional(),
  'published-print': publishedPrintSchema.optional(),
  funder: funderSchema.optional(),
});
