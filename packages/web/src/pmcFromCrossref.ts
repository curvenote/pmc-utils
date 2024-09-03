import { KNOWN_FUNDERS } from './schema/pmc.js';
import type { PMCDepositMeta, PMCDepositGrant } from './schema/types.js';
import type { LookupResult, UserInfo } from './types.js';
import { assertIsDefined } from './utils.js';

export function crossrefToMinimalPMCDeposit(
  crossrefData: LookupResult,
  opts: {
    agency: string;
    grant: { id?: string; funder: string };
    systemEmail: string;
    user?: UserInfo;
  },
): PMCDepositMeta {
  if (!(KNOWN_FUNDERS as readonly string[]).includes(opts.grant.funder)) {
    throw new Error('Invalid funder');
  }

  const firstAuthor = crossrefData.data.author.find((author) => author.sequence === 'first');
  assertIsDefined(firstAuthor);

  const reviewer = {
    personType: 'reviewer' as 'author' | 'reviewer',
    fname: opts.user?.firstName ?? firstAuthor.given,
    lname: opts.user?.lastName ?? firstAuthor.family,
    email: opts.systemEmail,
  };

  const deposit: PMCDepositMeta = {
    agency: opts.agency,
    embargoMonths: 0,
    manuscriptTitle: crossrefData.data.title.join(' '),
    doi: crossrefData.doi,
    journalMeta: {
      issn: crossrefData.data['issn-type']?.map((issn) => ({
        issnType: issn.type,
        value: issn.value,
      })),
    },
    contacts: {
      person: [reviewer],
    },
    grants: {
      grant: [
        {
          id: opts.grant.id,
          funder: opts.grant.funder as PMCDepositGrant['funder'],
        },
      ],
    },
  };

  return deposit;
}
