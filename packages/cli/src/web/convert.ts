import { KNOWN_FUNDERS, type DepositMeta, type Grant } from './schema/pmc.js';
import type { LookupResult, UserInfo } from './types.js';

function assertIsDefined<T>(value: T): asserts value is NonNullable<T> {
  if (value === undefined || value === null) {
    throw new Error(`${value} is not defined`);
  }
}

export function crossrefToMinimalPMCDeposit(
  crossrefData: LookupResult,
  opts: {
    agency: string;
    grant: { id?: string; funder: string };
    systemEmail: string;
    user?: UserInfo;
  },
): DepositMeta {
  if (!KNOWN_FUNDERS.includes(opts.grant.funder)) {
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

  const deposit: DepositMeta = {
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
          funder: opts.grant.funder as Grant['funder'],
        },
      ],
    },
  };

  return deposit;
}
