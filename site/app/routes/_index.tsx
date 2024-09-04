/* eslint-disable @typescript-eslint/no-explicit-any */
import type { MetaFunction } from '@remix-run/node';
import { json, useFetcher } from '@remix-run/react';
import { withContext } from '../backend/context';
import { createDepositFile, createJobManifest, nihFuzzyJournalLookup } from '../backend';
import { AAMDepositManifest, lookupMetadata } from '@curvenote/pmc-web';
import { useEffect, useState } from 'react';
import manifest from '../components/manifest.json';
import classNames from 'classnames';

export const meta: MetaFunction = () => {
  return [
    { title: 'PMC Prototyping' },
    { name: 'description', content: 'An initial prototype to exercise PMC submission mechanics' },
  ];
};

async function actionCheckDoi(formData: FormData) {
  const doi = formData.get('doi') as string;
  try {
    const crossref = await lookupMetadata(doi, { fetch, log: console });
    console.log('Crossref metadata', crossref);
    return { crossref };
  } catch (e: any) {
    console.error('Error looking up metadata for DOI', doi, e);
    return { error: e.message };
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function actionCreateJobManifest(formData: FormData) {
  const result = await createJobManifest(manifest as AAMDepositManifest);
  return result;
}

async function actionCreateDepositFile(formData: FormData) {
  const jobId = formData.get('jobId') as string;
  console.log('Creating deposit file for job', jobId);
  const { ok, error, stdout, xml } = await createDepositFile(jobId);

  return { jobId, ok, error, stdout, xml };
}

interface PMCJournalMeta {
  journalTitle: string | null;
  issn: string | null;
  issnType: string | null;
  nlmId: string | null;
}

async function actionJournalOpenAlex(formData: FormData) {
  const journal = formData.get('journal-lookup') as string;
  console.log('Looking up journal', journal);
  try {
    const resp = await fetch(
      `https://api.openalex.org/sources?search=${encodeURIComponent(journal)}`,
    );
    if (!resp.ok) {
      throw new Error(`Failed to lookup journal ${journal}`);
    }

    const data = await resp.json();
    const journals: PMCJournalMeta[] = data.results.map((source: any) => ({
      journalTitle: source.display_name,
      issn: source.issn_l ?? source.issn?.[0],
      issnType: null,
      nlmId: null,
    }));

    return { journals, total: data.meta.count, perPage: data.meta.per_page };
  } catch (e: any) {
    console.error('Error looking up journal', journal, e);
    return { error: e.message };
  }
}

async function actionJournalCrossref(formData: FormData) {
  const journal = formData.get('journal-lookup') as string;
  console.log('Looking up journal', journal);
  try {
    const resp = await fetch(
      `https://api.crossref.org/journals?query=${encodeURIComponent(journal)}`,
    );
    if (!resp.ok) {
      throw new Error(`Failed to lookup journal ${journal}`);
    }

    const data = await resp.json();
    const journals: PMCJournalMeta[] = data.message.items.map((item: any) => ({
      journalTitle: item.title,
      issn: item.ISSN?.[0] ?? null,
      issnType: item['issn-type'].find((i: any) => i.value === item.ISSN?.[0])?.type ?? null,
      nlmId: null,
    }));

    return {
      journals,
      total: data.message['total-results'],
      perPage: data.message['items-per-page'],
    };
  } catch (e: any) {
    console.error('Error looking up journal', journal, e);
    return { error: e.message };
  }
}

async function actionJournalNIH(formData: FormData) {
  const journal = formData.get('journal-lookup') as string;
  const { journals, total, perPage } = await nihFuzzyJournalLookup(journal);
  const mapped = journals.map((item: any) => ({
    journalTitle: item.JournalTitle,
    issn: item.ISSN?.[0]?.value ?? null,
    issnType: item.ISSN?.[0]?.type ?? null,
    nlmId: item.NlmId,
  }));
  return { journals: mapped, total, perPage };
}

async function actionFundingNIH(formData: FormData) {
  const funding = formData.get('funding-lookup') as string;
  console.log('Looking up funding', funding);
  return { funding };
}

export const action = withContext(async (ctx) => {
  const formData = await ctx.request.formData();
  const intent = formData.get('intent');

  switch (intent) {
    case 'check-doi': {
      return json({ intent, result: await actionCheckDoi(formData) });
    }
    case 'create-job-manifest': {
      return json({ intent, result: await actionCreateJobManifest(formData) });
    }
    case 'create-deposit': {
      return json({ intent, result: await actionCreateDepositFile(formData) });
    }
    case 'journal-lookup-openalex': {
      return json({ intent, result: await actionJournalOpenAlex(formData) });
    }
    case 'journal-lookup-crossref': {
      return json({ intent, result: await actionJournalCrossref(formData) });
    }
    case 'journal-lookup-nih': {
      return json({ intent, result: await actionJournalNIH(formData) });
    }
    case 'funding-lookup-nih': {
      return json({ intent, result: await actionFundingNIH(formData) });
    }
  }

  return { intent };
});

function Select({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="flex flex-col flex-grow max-w-sm">
      <label id={`${name}-label`} htmlFor={name} className="text-xs">
        type
      </label>
      <select className="p-1 border border-gray-300 rounded" value={value}>
        <option value="manuscript">Manuscript</option>
        <option value="figure">Figure</option>
        <option value="table">Table</option>
        <option value="supplementary">Supplementary</option>
      </select>
    </div>
  );
}

function TextField({
  name,
  label,
  type = 'text',
  value,
  disabled = false,
}: {
  name: string;
  label: string;
  type?: string;
  value?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col flex-grow max-w-sm">
      <label id={`${name}-label`} htmlFor={name} className="text-xs">
        {label}
      </label>
      <input
        type={type}
        name={name}
        className="p-1 border border-gray-300 rounded"
        placeholder={`e.g. ${label}`}
        value={value}
        aria-labelledby={`${name}-label`}
        disabled={disabled}
      />
    </div>
  );
}

function formatXml(xml: string, tab?: string) {
  // tab = optional indent value, default is tab (\t)
  let formatted = '',
    indent = '';
  tab = tab || '\t';
  xml.split(/>\s*</).forEach(function (node) {
    if (node.match(/^\/\w/)) indent = indent.substring(tab.length); // decrease indent by one 'tab'
    formatted += indent + '<' + node + '>\r\n';
    if (node.match(/^<?\w[^>]*[^\/]$/)) indent += tab; // increase indent
  });
  return formatted.substring(1, formatted.length - 3);
}

function JournalListing({
  journals,
  total,
  perPage,
}: {
  journals: PMCJournalMeta[];
  total: number;
  perPage: number;
}) {
  return (
    <details className="space-y-2">
      <summary className="">
        Results: ({total > perPage ? perPage : total} of {total})
      </summary>
      <div className="grid grid-cols-2 text-sm">
        {journals.map((journal) => (
          <div key={journal.issn} className="flex flex-col gap-1 m-1 p-1 border rounded">
            <div className={classNames({ 'text-red-600': !journal.journalTitle })}>
              title: {journal.journalTitle ?? 'null'}
            </div>
            <div className={classNames({ 'text-red-600': !journal.issn })}>
              issn: {journal.issn ?? 'null'}
            </div>
            <div className={classNames({ 'text-red-600': !journal.issnType })}>
              issnType: {journal.issnType ?? 'null'}
            </div>
            <div className={classNames({ 'text-red-600': !journal.nlmId })}>
              nlmId: {journal.nlmId ?? 'null'}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

export default function Index() {
  const fetcher = useFetcher<{
    intent: string;
    error?: string;
    result?: {
      jobId?: string;
      manifest?: AAMDepositManifest;
      ok?: boolean;
      error?: string;
      stdout?: string;
      xml?: string;
      crossref?: string;
      journals?: PMCJournalMeta[];
      total?: number;
      perPage?: number;
    };
  }>();
  const [intents, setIntents] = useState<string[]>([]);

  useEffect(() => {
    if (fetcher.data && fetcher.data.intent) {
      setIntents((prev) => (fetcher.data?.intent ? [...prev, fetcher.data.intent] : prev));
    }
  }, [fetcher.data]);

  return (
    <div className="container max-w-4xl mx-auto font-mono">
      <div className="p-12 space-y-6">
        <h1 className="text-3xl">PMC Prototyping</h1>
        <details>
          <summary className="text-sm">actions</summary>
          {intents.map((intent, i) => (
            <div key={`${intent}-${i}`} className="rounded bg-green-200 p-1">
              Form Action: {intent}
            </div>
          ))}
        </details>
        <div className="space-y-3">
          <h2 className="text-2xl">Form based Entry</h2>
          <div className="rounded p-3 border space-y-6">
            <h3 className="text-xl">Files</h3>
            <div className="flex items-end gap-2">
              <TextField name="file-1-filename" label="filename" value="./manuscript.docx" />
              <Select name="file-1-type" value="manuscript" />
              <TextField name="file-1-label" label="label" value="1" />
              <div className="align-middle">X</div>
            </div>
            <div className="flex items-end gap-2">
              <TextField name="file-2-filename" label="filename" value="./figure1.png" />
              <Select name="file-2-type" value="figure" />
              <TextField name="file-2-label" label="label" value="Figure 1" />
              <div className="align-middle">X</div>
            </div>
            <div className="flex items-end gap-2">
              <TextField name="file-3-filename" label="filename" value="./table1.csv" />
              <Select name="file-3-type" value="table" />
              <TextField name="file-3-label" label="label" value="Table 1" />
              <div className="align-middle">X</div>
            </div>
            <div className="flex items-end gap-2">
              <TextField name="file-4-filename" label="filename" value="./figures.docx" />
              <Select name="file-4-type" value="supplementary" />
              <TextField name="file-4-label" label="label" value="Figures" />
              <div className="align-middle">X</div>
            </div>
            <fetcher.Form className="space-y-3" method="post">
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 items-end pb-1">
                  <TextField
                    name="doi"
                    label="Lookup from DOI"
                    value="10.1038/s41467-024-48562-0"
                  />
                  <div className="flex items-end">
                    <button
                      name="intent"
                      value="check-doi"
                      className="px-4 py-1 text-white bg-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed rounded"
                    >
                      Query DOI
                    </button>
                  </div>
                </div>
                {fetcher.data?.result?.crossref && (
                  <details className="text-green-600">
                    <summary className="text-sm">Relevant Crossref fields</summary>
                    <pre className="text-sm">
                      {JSON.stringify(fetcher.data?.result?.crossref, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </fetcher.Form>
            <TextField
              name="manuscript-title"
              label="Manuscript Title"
              value="My Research Article"
            />
            <fetcher.Form className="space-y-3" method="post">
              <div className="flex items-end gap-2">
                <TextField name="journal-lookup" label="Journal Search" />
                <div>
                  <button
                    name="intent"
                    value="journal-lookup-openalex"
                    className="px-4 py-1 text-white bg-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed rounded"
                  >
                    OpenAlex
                  </button>
                </div>
                <div>
                  <button
                    name="intent"
                    value="journal-lookup-crossref"
                    className="px-4 py-1 text-white bg-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed rounded"
                  >
                    Crossref
                  </button>
                </div>
                <div>
                  <button
                    name="intent"
                    value="journal-lookup-nih"
                    className="px-4 py-1 text-white bg-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed rounded"
                  >
                    NIHList
                  </button>
                </div>
              </div>
              {fetcher.data?.result?.journals && (
                <JournalListing
                  journals={fetcher.data?.result?.journals}
                  total={fetcher.data?.result.total ?? 0}
                  perPage={fetcher.data?.result.perPage ?? 0}
                />
              )}
            </fetcher.Form>
            <div className="flex items-end gap-2">
              <TextField name="funding-lookup" label="Funding Search" />
              <div>
                <button
                  name="intent"
                  value="funding-lookup-nih"
                  className="px-4 py-1 text-white bg-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed rounded"
                >
                  Search (nih reporter)
                </button>
              </div>
            </div>
            <fetcher.Form className="space-y-3" method="post">
              <div className="flex flex-col items-start gap-3">
                <button
                  name="intent"
                  value="create-job-manifest"
                  className="px-4 py-1 text-white bg-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed rounded"
                >
                  Create Job Manifest 📃
                </button>
                {fetcher.state === 'loading' &&
                  fetcher.formData?.get('intent') === 'create-job-manifest' && (
                    <div className=" text-green-500">Submitting...</div>
                  )}
                {fetcher.data?.intent === 'create-job-manifest' && (
                  <div className="text-sm text-green-600">
                    Sent job {fetcher.data.result?.jobId}
                  </div>
                )}
                {fetcher.data?.result?.manifest && (
                  <details className="text-green-600">
                    <summary className="text-sm">Job Manifest</summary>
                    <pre className="text-sm">{JSON.stringify(manifest, null, 2)}</pre>
                  </details>
                )}
              </div>
            </fetcher.Form>
            <fetcher.Form className="space-y-3" method="post">
              <input type="hidden" name="jobId" value={fetcher.data?.result?.jobId} />
              <button
                name="intent"
                value="create-deposit"
                className="px-4 py-1 text-white bg-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed rounded"
                disabled={!fetcher.data?.result?.jobId}
              >
                Create Deposit File 🤖
              </button>
              {fetcher.data?.result?.xml && (
                <details className="text-green-600">
                  <summary className="text-sm">bulk_meta.xml</summary>
                  <pre className="text-sm">{formatXml(fetcher.data?.result?.xml)}</pre>
                </details>
              )}
            </fetcher.Form>
          </div>
        </div>
      </div>
    </div>
  );
}
