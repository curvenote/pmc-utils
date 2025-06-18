import { pmcXmlFromManifest, type AAMDepositManifest, type IClientOptions } from 'pmc-utils';
import { AAMDepositManifestSchema } from 'pmc-utils';
import path from 'node:path';
import fs from 'node:fs/promises';
import { create as createTar } from 'tar';
import { validateXml } from './validateXml.js';

/*
Manifest
The manifest file is a tab-delimited, plain text file that lists all of the other files in the package.
The format of the contents of the manifest file is as follows:
<file_type> <label> <file_name>

1. <file_type> is a string literal. The field is case-sensitive and must be one of the following:

File Type              Description
bulksub_meta_xml       Required meta information file, described in the next section.
manuscript             Text file(s) that contain the manuscript text. Each submission must contain at least one, though a single manuscript broken into multiple files is also permissible.
figure                 Figure file
table                  Table file
supplement             Supplementary material file

2. <label> is a label that will be used to differentiate between the files of each type.
   This field is required for all file types except manuscript when there is only one manuscript file.
   Labels are used to identify files sent and should be descriptive when possible, mirroring how content is called out in the text (e.g., 2a, 2b).
   In the case of supplementary material files, the string supplied here will be used as text for a hyperlink in the PMC manuscript.

3. <file_name> is the name of the file in the archive.

Example manifest:
bulksub_meta_xml    bulk_meta.xml
manuscript  manuscript.pdf
supplement  Supp1 supp.docx
*/
export function preparePMCManifestText(manifest: AAMDepositManifest) {
  const text = ['bulksub_meta_xml\tbulk_meta.xml\n'];

  const manuscripts = manifest.files.filter((f) => f.type === 'manuscript');
  if (manuscripts.length === 1) {
    text.push(`manuscript\t${manuscripts[0].filename}\n`);
  } else {
    manuscripts.forEach((f, i) => {
      text.push(`manuscript\t${f.label ?? i + 1}\t${f.filename}\n`);
    });
  }

  const others = manifest.files.filter((f) => f.type !== 'manuscript');
  others.forEach((f) => {
    text.push(`${f.type}\t${f.label}\t${f.filename}\n`);
  });

  return text.join('');
}

export async function buildDeposit(
  maybeManifest: unknown,
  opts: IClientOptions & { output?: string; keepFiles?: boolean },
) {
  // validate the manifest
  const result = AAMDepositManifestSchema.safeParse(maybeManifest);

  if (result.error) {
    opts.log.error(`Invalid manifest: ${result.error.message}`);
    throw new Error(`Invalid manifest: ${result.error.message}`);
  }

  const manifest: AAMDepositManifest = result.data;

  // verify location of files
  const fileResults = await Promise.all(
    manifest.files.map(async (f) => {
      if (f.storage === 'local') {
        try {
          await fs.access(path.join(f.path, f.filename));
          return { ok: true };
        } catch (e) {
          return { ok: false, error: e };
        }
      } else {
        return { ok: false, error: new Error('Only local files are supported') };
      }
    }),
  );
  const missingFiles = fileResults.filter((r) => !r.ok);
  if (missingFiles.length > 0) {
    opts.log.error('Missing files:');
    const errors = missingFiles.map((f) => {
      opts.log.error(f.error);
      return f.error;
    });
    throw new Error(`Missing files: ${errors.join(', ')}`);
  }

  // prepare the manifest text
  const manifestText = preparePMCManifestText(manifest);

  // prepare the JSON metadtata object
  const xml = pmcXmlFromManifest(manifest);
  try {
    // validate the XML against the DTD
    await validateXml(xml);
  } catch (e) {
    opts.log.error('Error validating XML');
    opts.log.debug(e);
    throw e;
  }

  // 0 create the deposit folder
  const depositFolder = path.join(opts.output ?? 'deposits', `/pmc/${manifest.taskId}`);
  try {
    await fs.mkdir(depositFolder, { recursive: true });
    opts.log.info(`Created deposit folder at ${depositFolder}`);
  } catch (e) {
    opts.log.error('Error creating deposit folder');
    opts.log.debug(e);
    throw e;
  }

  // copy files into correct location
  await Promise.all(
    manifest.files.map(async (f) => {
      if (f.storage === 'local') {
        await fs.copyFile(
          path.resolve(path.join(f.path, f.filename)),
          path.join(depositFolder, f.filename),
        );
      } else {
        throw new Error('copy step: only local files are supported');
      }
    }),
  );

  // write the manifest.txt file
  await fs.writeFile(path.join(depositFolder, 'manifest.txt'), manifestText);

  // write the bulk_meta.xml file using the meta object, converting to XML using a known dtd
  await fs.writeFile(path.join(depositFolder, 'bulk_meta.xml'), xml);

  // create a tar.gz file using the depositFolder contents
  const tarFileName = path.join(opts.output ?? 'deposits', `/pmc/${manifest.taskId}.tar.gz`);
  try {
    await createTar({ gzip: true, file: tarFileName, cwd: depositFolder }, ['.']);
    opts.log.info(`Created tar.gz file at ${tarFileName}`);
  } catch (e) {
    opts.log.error('Error creating tar.gz file');
    opts.log.debug(e);
    throw e;
  }

  // 4 remove the depositFolder
  if (!opts.keepFiles) {
    await fs.rm(depositFolder, { recursive: true });
  }

  // 5 return the location of the tar.gz file
  return tarFileName;
}
