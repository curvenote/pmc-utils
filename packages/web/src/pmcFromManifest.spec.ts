// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, it, expect } from 'vitest';
import { pmcXmlFromManifest } from './pmcFromManifest.js';
import { AAMDepositManifestSchema } from './schema/manifest.js';
import type { AAMDepositManifest } from './types.js';

describe('PMC Manifest Schema and XML Generation', () => {
  const validManifest: AAMDepositManifest = {
    taskId: 'test-task-123',
    agency: 'hhmi',
    doi: '10.1234/example.doi',
    metadata: {
      title: 'Test Manuscript Title',
      journal: {
        issn: '1234-5678',
        issnType: 'electronic',
        title: 'Test Journal Title', // Now required!
        shortTitle: 'Test J', // Optional
      },
      authors: [
        {
          fname: 'John',
          mname: 'Middle', // Optional
          lname: 'Doe',
          email: 'john.doe@example.com',
          contactType: 'reviewer',
        },
        {
          fname: 'Jane',
          lname: 'Smith',
          email: 'jane.smith@example.com',
          contactType: 'author',
        },
      ],
      grants: [
        {
          funder: 'nih',
          id: 'R01-123456', // Optional
        },
        {
          funder: 'hhmi',
          // No id - should be fine since it's optional
        },
      ],
    },
    files: [
      {
        filename: 'manuscript.pdf',
        type: 'manuscript',
        label: 'main',
        storage: 'local',
        path: './manuscripts',
        contentType: 'application/pdf', // Optional
      },
      {
        filename: 'figure1.png',
        type: 'figure',
        label: 'fig1',
        storage: 'local',
        path: './figures',
        // No contentType - should be fine since it's optional
      },
    ],
  };

  const minimalValidManifest: AAMDepositManifest = {
    taskId: 'minimal-task',
    agency: 'hhmi',
    metadata: {
      title: 'Minimal Title',
      journal: {
        issn: '9876-5432',
        issnType: 'print',
        title: 'Minimal Journal', // Required
      },
      authors: [
        {
          fname: 'Alice',
          lname: 'Johnson',
          email: 'alice@example.com',
          contactType: 'reviewer',
        },
      ],
      grants: [
        {
          funder: 'nasa',
        },
      ],
    },
    files: [
      {
        filename: 'paper.docx',
        type: 'manuscript',
        label: 'main',
        storage: 'local',
        path: './docs',
      },
    ],
  };

  describe('Schema Validation', () => {
    it('should validate a complete valid manifest', () => {
      const result = AAMDepositManifestSchema.safeParse(validManifest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.metadata.journal.title).toBe('Test Journal Title');
      }
    });

    it('should validate a minimal valid manifest', () => {
      const result = AAMDepositManifestSchema.safeParse(minimalValidManifest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.metadata.journal.title).toBe('Minimal Journal');
      }
    });

    it('should reject manifest without journal title', () => {
      const invalidManifest = {
        ...validManifest,
        metadata: {
          ...validManifest.metadata,
          journal: {
            issn: '1234-5678',
            issnType: 'electronic',
            // Missing title - should fail
          },
        },
      };

      const result = AAMDepositManifestSchema.safeParse(invalidManifest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some((e) => e.path.includes('title'))).toBe(true);
      }
    });

    it('should reject manifest with empty journal title', () => {
      const invalidManifest = {
        ...validManifest,
        metadata: {
          ...validManifest.metadata,
          journal: {
            ...validManifest.metadata.journal,
            title: '', // Empty string should fail
          },
        },
      };

      const result = AAMDepositManifestSchema.safeParse(invalidManifest);
      expect(result.success).toBe(false);
    });

    it('should reject manifest without required fields', () => {
      const invalidManifest = {
        // Missing taskId
        agency: 'hhmi',
        metadata: {
          title: 'Test',
          journal: {
            issn: '1234-5678',
            issnType: 'electronic',
            title: 'Test Journal',
          },
          authors: [],
          grants: [],
        },
        files: [],
      };

      const result = AAMDepositManifestSchema.safeParse(invalidManifest);
      expect(result.success).toBe(false);
    });
  });

  describe('XML Generation', () => {
    it('should generate valid PMC XML from complete manifest', () => {
      const xml = pmcXmlFromManifest(validManifest);

      expect(xml).toContain('<?xml version="1.0" encoding="utf-8"?>');
      expect(xml).toContain('<!DOCTYPE manuscript-submit SYSTEM "manuscript-bulk.dtd">');
      expect(xml).toContain('<manuscript-submit');
      expect(xml).toContain('agency="hhmi"');
      expect(xml).toContain('doi="https://doi.org/10.1234/example.doi"');
      expect(xml).toContain('<journal-meta>');
      expect(xml).toContain('<issn issn-type="electronic">1234-5678</issn>');
      expect(xml).toContain('<journal-title>Test Journal Title</journal-title>');
      expect(xml).toContain('<manuscript-title>Test Manuscript Title</manuscript-title>');
      expect(xml).toContain('<contacts>');
      expect(xml).toContain('person-type="reviewer"');
      expect(xml).toContain('fname="John"');
      expect(xml).toContain('mname="Middle"');
      expect(xml).toContain('<grants>');
      expect(xml).toContain('funder="nih"');
      expect(xml).toContain('id="R01-123456"');
    });

    it('should generate valid PMC XML from minimal manifest', () => {
      const xml = pmcXmlFromManifest(minimalValidManifest);

      expect(xml).toContain('<?xml version="1.0" encoding="utf-8"?>');
      expect(xml).toContain('<journal-title>Minimal Journal</journal-title>');
      expect(xml).toContain('<issn issn-type="print">9876-5432</issn>');
      expect(xml).toContain('<manuscript-title>Minimal Title</manuscript-title>');
      expect(xml).toContain('funder="nasa"');
      expect(xml).toContain('fname="Alice"');
      expect(xml).toContain('lname="Johnson"');
    });

    it('should always include journal-title element (no longer conditional)', () => {
      const xml = pmcXmlFromManifest(validManifest);

      // Should always include journal-title since it's now required
      expect(xml).toContain('<journal-title>Test Journal Title</journal-title>');

      // Should not have any conditional logic artifacts
      expect(xml).not.toContain('undefined');
      expect(xml).not.toContain('null');
    });

    it('should handle reviewer contact correctly', () => {
      const xml = pmcXmlFromManifest(validManifest);

      // Should use the first reviewer found
      expect(xml).toContain('person-type="reviewer"');
      expect(xml).toContain('fname="John"');
      expect(xml).toContain('email="john.doe@example.com"');
    });

    it('should throw error if no reviewer contact found', () => {
      const noReviewerManifest = {
        ...validManifest,
        metadata: {
          ...validManifest.metadata,
          authors: [
            {
              fname: 'Jane',
              lname: 'Smith',
              email: 'jane@example.com',
              contactType: 'author' as const, // No reviewer
            },
          ],
        },
      };

      expect(() => pmcXmlFromManifest(noReviewerManifest)).toThrow(
        'At least one author must be a reviewer',
      );
    });

    it('should validate PMC funders', () => {
      const invalidFunderManifest = {
        ...validManifest,
        metadata: {
          ...validManifest.metadata,
          grants: [
            {
              funder: 'invalid-funder', // Not in PMC approved list
            },
          ],
        },
      };

      expect(() => pmcXmlFromManifest(invalidFunderManifest)).toThrow(
        'Invalid funder: invalid-funder',
      );
    });
  });
});
