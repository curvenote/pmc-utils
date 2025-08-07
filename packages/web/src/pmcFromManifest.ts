import { KNOWN_FUNDERS, KNOWN_ISSN_TYPE } from './schema/pmc.js';
import type { AAMDepositManifest, PMCFunder, PMCISSNType } from './types.js';
import { toXml } from 'xast-util-to-xml';
import { u } from 'unist-builder';
import { e, t } from './utils.js';
import { doi as doiUtils } from 'doi-utils';

export function validatePMCFunder(funder: string): asserts funder is PMCFunder {
  if (!(KNOWN_FUNDERS as readonly string[]).includes(funder)) {
    throw new Error(`Invalid funder: ${funder}`);
  }
}

export function validatePMCISSNType(issnType: string): asserts issnType is PMCISSNType {
  if (!(KNOWN_ISSN_TYPE as readonly string[]).includes(issnType)) {
    throw new Error(`Invalid issnType: ${issnType}`);
  }
}

/**
 * create a tree from the manifest containing the minimal metadata needed for a PMC deposit
 *
 * @param manifest
 * @returns
 */
function treeFromManifest(manifest: AAMDepositManifest) {
  const reviewer = manifest.metadata.authors.find((author) => author.contactType === 'reviewer');
  if (!reviewer) {
    throw new Error('At least one author must be a reviewer');
  }

  manifest.metadata.grants.forEach((grant) => {
    validatePMCFunder(grant.funder);
  });

  const journalMeta = e('journal-meta', [
    e('issn', { 'issn-type': manifest.metadata.journal.issnType }, [
      t(manifest.metadata.journal.issn),
    ]),
    e('journal-title', [t(manifest.metadata.journal.title)]),
  ]);

  const children = [
    journalMeta,
    e('manuscript-title', [t(manifest.metadata.title)]),
    e('contacts', [
      e('person', {
        'person-type': 'reviewer',
        fname: reviewer.fname,
        mname: reviewer.mname,
        lname: reviewer.lname,
        email: reviewer.email,
      }),
    ]),
    e('grants', [
      ...manifest.metadata.grants.map((grant) => {
        return e('grant', { id: grant.id, funder: grant.funder });
      }),
    ]),
  ];

  const body = e(
    'manuscript-submit',
    {
      agency: manifest.agency,
      'embargo-months': 0,
      doi: doiUtils.buildUrl(manifest.doi) as string,
    },
    children,
  );

  return u('root', [
    u('instruction', { name: 'xml', value: 'version="1.0" encoding="utf-8"' }),
    u('doctype', { name: 'manuscript-submit', system: 'manuscript-bulk.dtd' }),
    body,
  ]);
}

export function pmcXmlFromManifest(manifest: AAMDepositManifest): string {
  return toXml(treeFromManifest(manifest), { closeEmptyElements: true });
}
