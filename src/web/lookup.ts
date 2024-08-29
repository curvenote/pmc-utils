import type { FetchLike, ILookupOptions, Logger } from '../types.js';
import { doi as doiUtils } from 'doi-utils';
import type { ExpectedCrossrefFields } from './schema/crossref.js';

async function makeMetadataRequest(doi: string, opts: ILookupOptions) {
  const url = `https://api.crossref.org/works/${doi}`;
  const resp = await opts.fetch(url);

  if (!resp.ok) {
    opts.log.error(`Failed to retrieve metadata for ${doi}: ${resp.statusText}`);
    process.exit(1);
  }

  return resp.json();
}

const expectedFields = [
  'title',
  'ISSN',
  'issn-type',
  'container-title',
  'short-container-title',
  'author',
  'published-online',
  'published-print',
  'funder',
  'URL',
];

function extractExpectedFields(expected: string[], recieved: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(recieved).filter(([key]) => expectedFields.includes(key)),
  ) as ExpectedCrossrefFields;
}

function listMissingFields(expected: string[], recieved: Record<string, unknown>) {
  const missing = expected.filter((field) => !recieved[field]);
  return missing.length > 0 ? missing : undefined;
}

export async function lookupMetadata(
  doi: string,
  opts: { fetch: FetchLike; log: Logger } = { fetch: fetch, log: console },
) {
  if (!doiUtils.validate(doi)) {
    opts.log.error('Invalid DOI:', doi);
    process.exit(1);
  }

  opts.log.info(`Retrieving metadata for ${doi}`);

  const metadata = await makeMetadataRequest(doi, opts);

  const missing = listMissingFields(expectedFields, metadata.message);

  // MAYBE TODO we could validate the fields here and return an error if any are missing
  // the specific information/attributes that we need

  const data = extractExpectedFields(expectedFields, metadata.message);

  return { doi: doiUtils.buildUrl(doi)!, missing, data };
}
