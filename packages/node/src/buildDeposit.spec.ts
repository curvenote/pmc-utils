// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildDeposit, preparePMCManifestText } from './buildDeposit.js';
import type { AAMDepositManifest } from 'pmc-utils';
import fs from 'node:fs/promises';
import { create as createTar } from 'tar';

// Mock dependencies
vi.mock('node:fs/promises');
vi.mock('tar');
vi.mock('./validateXml.js', () => ({
  validateXml: vi.fn().mockResolvedValue(true),
}));

const mockFs = vi.mocked(fs);
const mockCreateTar = vi.mocked(createTar);

describe('PMC Deposit Building', () => {
  const validManifest: AAMDepositManifest = {
    taskId: 'test-deposit-123',
    agency: 'hhmi',
    doi: '10.1234/test.doi',
    metadata: {
      title: 'Test Manuscript for Deposit',
      journal: {
        issn: '1234-5678',
        issnType: 'electronic',
        title: 'Journal of Test Studies', // Required field
      },
      authors: [
        {
          fname: 'Dr. Test',
          lname: 'Reviewer',
          email: 'reviewer@example.com',
          contactType: 'reviewer',
        },
      ],
      grants: [
        {
          funder: 'nih',
          id: 'R01-TEST123',
        },
      ],
    },
    files: [
      {
        filename: 'manuscript.pdf',
        type: 'manuscript',
        label: 'main',
        storage: 'local',
        path: './test-files',
      },
      {
        filename: 'figure1.jpg',
        type: 'figure',
        label: 'fig1',
        storage: 'local',
        path: './test-files',
      },
    ],
  };

  const mockLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful file access
    mockFs.access.mockResolvedValue(undefined);
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.copyFile.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.rm.mockResolvedValue(undefined);

    // Mock successful tar creation
    mockCreateTar.mockResolvedValue(undefined);
  });

  describe('preparePMCManifestText', () => {
    it('should generate correct manifest text format', () => {
      const manifestText = preparePMCManifestText(validManifest);

      const lines = manifestText.split('\n').filter((line) => line.trim());

      expect(lines[0]).toBe('bulksub_meta_xml\tbulk_meta.xml');
      expect(lines[1]).toBe('manuscript\tmanuscript.pdf');
      expect(lines[2]).toBe('figure\tfig1\tfigure1.jpg');
      expect(lines.length).toBe(3);
    });

    it('should handle multiple manuscripts with labels', () => {
      const multiManuscriptManifest = {
        ...validManifest,
        files: [
          {
            filename: 'part1.pdf',
            type: 'manuscript' as const,
            label: 'part1',
            storage: 'local' as const,
            path: './test',
          },
          {
            filename: 'part2.pdf',
            type: 'manuscript' as const,
            label: 'part2',
            storage: 'local' as const,
            path: './test',
          },
          {
            filename: 'figure1.jpg',
            type: 'figure' as const,
            label: 'fig1',
            storage: 'local' as const,
            path: './test',
          },
        ],
      };

      const manifestText = preparePMCManifestText(multiManuscriptManifest);
      const lines = manifestText.split('\n').filter((line) => line.trim());

      expect(lines[0]).toBe('bulksub_meta_xml\tbulk_meta.xml');
      expect(lines[1]).toBe('manuscript\tpart1\tpart1.pdf');
      expect(lines[2]).toBe('manuscript\tpart2\tpart2.pdf');
      expect(lines[3]).toBe('figure\tfig1\tfigure1.jpg');
    });

    it('should handle single manuscript without label', () => {
      const singleManuscriptManifest = {
        ...validManifest,
        files: [
          {
            filename: 'single.pdf',
            type: 'manuscript' as const,
            label: 'main',
            storage: 'local' as const,
            path: './test',
          },
        ],
      };

      const manifestText = preparePMCManifestText(singleManuscriptManifest);
      const lines = manifestText.split('\n').filter((line) => line.trim());

      expect(lines[0]).toBe('bulksub_meta_xml\tbulk_meta.xml');
      expect(lines[1]).toBe('manuscript\tsingle.pdf');
    });
  });

  describe('buildDeposit', () => {
    const buildOptions = {
      output: './test-output',
      keepFiles: false,
      fetch: global.fetch,
      log: mockLogger,
    };

    it('should build deposit successfully with valid manifest', async () => {
      const tarFile = await buildDeposit(validManifest, buildOptions);

      expect(tarFile).toBe('test-output/pmc/test-deposit-123.tar.gz');

      // Verify file access checks
      expect(mockFs.access).toHaveBeenCalledWith('test-files/manuscript.pdf');
      expect(mockFs.access).toHaveBeenCalledWith('test-files/figure1.jpg');

      // Verify directory creation
      expect(mockFs.mkdir).toHaveBeenCalledWith('test-output/pmc/test-deposit-123', {
        recursive: true,
      });

      // Verify file copying
      expect(mockFs.copyFile).toHaveBeenCalledWith(
        expect.stringContaining('manuscript.pdf'),
        'test-output/pmc/test-deposit-123/manuscript.pdf',
      );
      expect(mockFs.copyFile).toHaveBeenCalledWith(
        expect.stringContaining('figure1.jpg'),
        'test-output/pmc/test-deposit-123/figure1.jpg',
      );

      // Verify manifest and XML file writing
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'test-output/pmc/test-deposit-123/manifest.txt',
        expect.stringContaining('bulksub_meta_xml\tbulk_meta.xml'),
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'test-output/pmc/test-deposit-123/bulk_meta.xml',
        expect.stringContaining('<?xml'),
      );

      // Verify tar creation
      expect(mockCreateTar).toHaveBeenCalledWith(
        {
          gzip: true,
          file: 'test-output/pmc/test-deposit-123.tar.gz',
          cwd: 'test-output/pmc/test-deposit-123',
        },
        ['.'],
      );

      // Verify cleanup (since keepFiles is false)
      expect(mockFs.rm).toHaveBeenCalledWith('test-output/pmc/test-deposit-123', {
        recursive: true,
      });
    });

    it('should keep files when keepFiles option is true', async () => {
      const optionsWithKeepFiles = { ...buildOptions, keepFiles: true };

      await buildDeposit(validManifest, optionsWithKeepFiles);

      // Should not remove the deposit folder
      expect(mockFs.rm).not.toHaveBeenCalled();
    });

    it('should reject invalid manifest (missing journal title)', async () => {
      const invalidManifest = {
        ...validManifest,
        metadata: {
          ...validManifest.metadata,
          journal: {
            issn: '1234-5678',
            issnType: 'electronic' as const,
            // Missing title - should fail validation
          },
        },
      };

      await expect(buildDeposit(invalidManifest, buildOptions)).rejects.toThrow('Invalid manifest');

      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Invalid manifest'));
    });

    it('should reject manifest with missing files', async () => {
      // Mock file access to fail for one file
      mockFs.access
        .mockResolvedValueOnce(undefined) // First file exists
        .mockRejectedValueOnce(new Error('File not found')); // Second file missing

      await expect(buildDeposit(validManifest, buildOptions)).rejects.toThrow('Missing files');

      expect(mockLogger.error).toHaveBeenCalledWith('Missing files:');
    });

    it('should reject manifest with non-local storage', async () => {
      const cloudManifest = {
        ...validManifest,
        files: [
          {
            ...validManifest.files[0],
            storage: 'bucket' as const,
          },
        ],
      };

      await expect(buildDeposit(cloudManifest, buildOptions)).rejects.toThrow('Missing files');
    });

    it('should use default output directory when not specified', async () => {
      const optionsWithoutOutput = {
        fetch: global.fetch,
        log: mockLogger,
      };

      await buildDeposit(validManifest, optionsWithoutOutput);

      expect(mockFs.mkdir).toHaveBeenCalledWith('deposits/pmc/test-deposit-123', {
        recursive: true,
      });
    });

    it('should generate XML with journal title included', async () => {
      await buildDeposit(validManifest, buildOptions);

      // Find the call to writeFile for bulk_meta.xml
      const xmlWriteCall = mockFs.writeFile.mock.calls.find((call) =>
        call[0].toString().includes('bulk_meta.xml'),
      );

      expect(xmlWriteCall).toBeDefined();
      const xmlContent = xmlWriteCall![1] as string;

      // Verify the XML contains our required journal title
      expect(xmlContent).toContain('<journal-title>Journal of Test Studies</journal-title>');
      expect(xmlContent).toContain('<?xml version="1.0" encoding="utf-8"?>');
      expect(xmlContent).toContain('<!DOCTYPE manuscript-submit SYSTEM "manuscript-bulk.dtd">');
    });
  });
});
