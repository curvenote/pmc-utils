import { describe, it, expect } from 'vitest';
import { formatZodErrorForStatus } from './utils.js';
import { AAMDepositManifestSchema } from './schema/manifest.js';
import { z } from 'zod';

describe('formatZodErrorForStatus', () => {
  it('should format missing journal title error', () => {
    const invalidManifest = {
      taskId: 'test-123',
      agency: 'hhmi',
      metadata: {
        title: 'Test Title',
        journal: {
          issn: '1234-5678',
          issnType: 'electronic',
          // Missing title - should fail
        },
        authors: [
          {
            fname: 'John',
            lname: 'Doe',
            email: 'john@example.com',
            contactType: 'reviewer',
          },
        ],
        funding: [
          {
            funder: 'nih',
          },
        ],
      },
      files: [
        {
          filename: 'test.pdf',
          type: 'manuscript',
          label: 'main',
          storage: 'local',
          path: './test',
        },
      ],
    };

    const result = AAMDepositManifestSchema.safeParse(invalidManifest);
    expect(result.success).toBe(false);

    if (!result.success) {
      const statusMessage = formatZodErrorForStatus(result.error);
      expect(statusMessage).toBe('metadata - journal - title is required');
    }
  });

  it('should format empty journal title error', () => {
    const invalidManifest = {
      taskId: 'test-123',
      agency: 'hhmi',
      metadata: {
        title: 'Test Title',
        journal: {
          issn: '1234-5678',
          issnType: 'electronic',
          title: '', // Empty string should fail
        },
        authors: [
          {
            fname: 'John',
            lname: 'Doe',
            email: 'john@example.com',
            contactType: 'reviewer',
          },
        ],
        funding: [
          {
            funder: 'nih',
          },
        ],
      },
      files: [
        {
          filename: 'test.pdf',
          type: 'manuscript',
          label: 'main',
          storage: 'local',
          path: './test',
        },
      ],
    };

    const result = AAMDepositManifestSchema.safeParse(invalidManifest);
    expect(result.success).toBe(false);

    if (!result.success) {
      const statusMessage = formatZodErrorForStatus(result.error);
      expect(statusMessage).toBe('metadata - journal - title cannot be empty');
    }
  });

  it('should format invalid email error', () => {
    const invalidManifest = {
      taskId: 'test-123',
      agency: 'hhmi',
      metadata: {
        title: 'Test Title',
        journal: {
          issn: '1234-5678',
          issnType: 'electronic',
          title: 'Test Journal',
        },
        authors: [
          {
            fname: 'John',
            lname: 'Doe',
            email: 'invalid-email', // Invalid email
            contactType: 'reviewer',
          },
        ],
        funding: [
          {
            funder: 'nih',
          },
        ],
      },
      files: [
        {
          filename: 'test.pdf',
          type: 'manuscript',
          label: 'main',
          storage: 'local',
          path: './test',
        },
      ],
    };

    const result = AAMDepositManifestSchema.safeParse(invalidManifest);
    expect(result.success).toBe(false);

    if (!result.success) {
      const statusMessage = formatZodErrorForStatus(result.error);
      expect(statusMessage).toBe('metadata - authors - item 1 - email has an invalid value');
    }
  });

  it('should format array index errors nicely', () => {
    const invalidManifest = {
      taskId: 'test-123',
      agency: 'hhmi',
      metadata: {
        title: 'Test Title',
        journal: {
          issn: '1234-5678',
          issnType: 'electronic',
          title: 'Test Journal',
        },
        authors: [
          {
            fname: 'John',
            lname: 'Doe',
            email: 'john@example.com',
            contactType: 'reviewer',
          },
          {
            fname: 'Jane',
            lname: 'Smith',
            email: 'invalid-email', // Invalid email in second author
            contactType: 'author',
          },
        ],
        funding: [
          {
            funder: 'nih',
          },
        ],
      },
      files: [
        {
          filename: 'test.pdf',
          type: 'manuscript',
          label: 'main',
          storage: 'local',
          path: './test',
        },
      ],
    };

    const result = AAMDepositManifestSchema.safeParse(invalidManifest);
    expect(result.success).toBe(false);

    if (!result.success) {
      const statusMessage = formatZodErrorForStatus(result.error);
      expect(statusMessage).toBe('metadata - authors - item 2 - email has an invalid value');
    }
  });

  it('should handle empty error array', () => {
    const emptyError = new z.ZodError([]);
    const statusMessage = formatZodErrorForStatus(emptyError);
    expect(statusMessage).toBe('Validation failed');
  });
});
