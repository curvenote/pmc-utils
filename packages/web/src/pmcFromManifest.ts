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

  manifest.metadata.funding.forEach((funding) => {
    validatePMCFunder(funding.funder);
  });

  const children = [
    e('manuscript-title', [t(manifest.metadata.title)]),
    e('journal-meta', [
      e('issn', { issnType: manifest.metadata.journal.issnType }, [
        t(manifest.metadata.journal.issn),
      ]),
    ]),
    e('contacts', [
      e('person', {
        personType: 'reviewer',
        fname: reviewer.fname,
        mname: reviewer.mname,
        lname: reviewer.lname,
        email: reviewer.email,
      }),
    ]),
    e('grants', [
      ...manifest.metadata.funding.map((funding) => {
        return e('grant', { id: funding.grantId, funder: funding.funder });
      }),
    ]),
  ];

  if (manifest.doi) {
    children.push(
      e('URL', { urlType: 'full-text' }, [t(doiUtils.buildUrl(manifest.doi) as string)]),
    );
  }

  const body = e('manuscript-submit', { agency: manifest.agency, embargoMonths: 0 }, children);

  return u('root', [
    u('instruction', { name: 'xml', value: 'version="1.0" encoding="utf-8"' }),
    u('doctype', { name: 'manuscript-submit', system: 'manuscript-bulk.dtd' }),
    body,
  ]);
}

export function pmcXmlFromManifest(manifest: AAMDepositManifest): string {
  return toXml(treeFromManifest(manifest), { closeEmptyElements: true });
}
