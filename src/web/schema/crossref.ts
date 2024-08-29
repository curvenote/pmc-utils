import { z } from 'zod';

// Define fractional schemas
export const datePartsSchema = z.array(z.array(z.number())).min(1, 'Publication date is required');
export type DateParts = z.infer<typeof datePartsSchema>;

export const publishedOnlineSchema = z.object({
  'date-parts': datePartsSchema,
});
export type PublishedOnline = z.infer<typeof publishedOnlineSchema>;

export const publishedPrintSchema = z.object({
  'date-parts': datePartsSchema,
});
export type PublishedPrint = z.infer<typeof publishedPrintSchema>;

export const issnSchema = z.array(z.string().regex(/^\d{4}-\d{3}[\dxX]$/, 'Invalid ISSN format'));
export type ISSN = z.infer<typeof issnSchema>;

export const issnTypeSchema = z.array(
  z.object({
    value: z.string().regex(/^\d{4}-\d{3}[\dxX]$/, 'Invalid ISSN format'),
    type: z.enum(['print', 'electronic', 'linking']),
  }),
);
export type ISSType = z.infer<typeof issnTypeSchema>;

export const titleSchema = z.array(z.string());
export type Title = z.infer<typeof titleSchema>;

export const shortContainerTitleSchema = z.array(z.string());
export type ShortContainerTitle = z.infer<typeof shortContainerTitleSchema>;

export const containerTitleSchema = z.array(z.string());
export type ContainerTitle = z.infer<typeof containerTitleSchema>;

export const authorSchema = z.array(
  z.object({
    given: z.string().min(1, 'First name is required'),
    family: z.string().min(1, 'Surname is required'),
    email: z.string().email().optional(), // Email is optional but must be well-formatted if present
  }),
);
export type Author = z.infer<typeof authorSchema>;

export const funderSchema = z.array(
  z.object({
    name: z.string().min(1, 'Funder name is required'),
    DOI: z.string().optional(),
    award: z.array(z.string()).optional(),
  }),
);
export type Funder = z.infer<typeof funderSchema>;

export const urlSchema = z.string().url();
export type URL = z.infer<typeof urlSchema>;

export const expectedCrossrefFieldsSchema = z.object({
  title: titleSchema,
  ISSN: issnSchema,
  'issn-type': issnTypeSchema,
  'container-title': containerTitleSchema,
  'short-container-title': shortContainerTitleSchema,
  author: authorSchema,
  'published-online': publishedOnlineSchema,
  'published-print': publishedPrintSchema,
  funder: funderSchema,
});
export type ExpectedCrossrefFields = z.infer<typeof expectedCrossrefFieldsSchema>;
