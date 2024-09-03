import { KNOWN_FUNDERS, KNOWN_ISSN_TYPE, PMCDepositMetaSchema } from './schema/pmc.js';
import type { AAMDepositManifest, PMCDepositGrant, PMCDepositMeta, PMCISSN } from './types.js';

export function validatePMCFunder(funder: string): asserts funder is PMCDepositGrant['funder'] {
  if (!(KNOWN_FUNDERS as readonly string[]).includes(funder)) {
    throw new Error(`Invalid funder: ${funder}`);
  }
}

export function validatePMCISSNType(issnType: string): asserts issnType is PMCISSN['issnType'] {
  if (!(KNOWN_ISSN_TYPE as readonly string[]).includes(issnType)) {
    throw new Error(`Invalid issnType: ${issnType}`);
  }
}

export function pmcDepositFromManifest(manifest: AAMDepositManifest): PMCDepositMeta {
  const { agency, doi, metadata } = manifest;

  validatePMCISSNType(metadata.journal.issnType);

  const deposit: PMCDepositMeta = {
    agency,
    doi,
    embargoMonths: 0,
    manuscriptTitle: metadata.title, // TODO process to XML, could have formatting 'b|i|u|sub|sup"
    journalMeta: {
      issn: [
        {
          issnType: metadata.journal.issnType,
          value: metadata.journal.issn,
        },
      ],
    },
    contacts: {
      person: metadata.authors.map((author) => ({
        personType: author.contactType,
        fname: author.fname,
        mname: author.mname,
        lname: author.lname,
        email: author.email,
      })),
    },
    grants: {
      grant: metadata.funding.map((funding) => {
        validatePMCFunder(funding.funder);
        return {
          id: funding.grantId,
          funder: funding.funder,
        };
      }),
    },
  };

  const result = PMCDepositMetaSchema.safeParse(deposit);
  if (result.error) {
    throw new Error(
      `Processing the manifest generated an invalid deposit: ${result.error.message}`,
    );
  }

  return deposit;
}
