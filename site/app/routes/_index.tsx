import type { MetaFunction } from '@remix-run/node';
import { json, useFetcher } from '@remix-run/react';
import { withContext } from '../backend/context';
import { startPMCSubmission } from '../backend';
import { AAMDepositManifest } from '../../../packages/client/dist/types';

export const meta: MetaFunction = () => {
  return [
    { title: 'PMC Prototyping' },
    { name: 'description', content: 'An initial prototype to exercise PMC submission mechanics' },
  ];
};

async function actionCheckDoi(formData: FormData) {
  return null;
}

const manifest: AAMDepositManifest = {
  files: [
    {
      filename: 'data/manuscript.docx',
      kind: 'Manuscript', // validate against a list of known types
      label: '1',
      path: '/some/bucket/uid/depositId/manuscript',
    },
    {
      filename: 'data/figures.docx',
      kind: 'Figures', // validate against a list of known types
      label: '2',
      path: '/some/bucket/uid/depositId/figures',
    },
  ],
  doi: '10.1038/s41467-024-48562-0',
  metadata: {
    title: 'Title', // required
    journal: {
      issn: '1234-567',
      title: 'Journal',
      shortTitle: 'J.',
    },
    authors: [
      // one is required or type reviewer
      { fname: 'First', mname: 'Middle', lname: 'Last', email: '', contactType: 'reviewer' },
    ],
    funding: [{ funder: 'hhmi' }, { funder: 'nih', grantId: 'q1w2e3r4' }], // can be empty
  },
};

async function actionSubmitToPmc(formData: FormData) {
  const jobId = await startPMCSubmission(manifest);

  return { jobId };
}

export const action = withContext(async (ctx) => {
  const formData = await ctx.request.formData();
  const intent = formData.get('intent');

  switch (intent) {
    case 'check-doi': {
      return json({ intent, result: await actionCheckDoi(formData) });
    }
    case 'submit-to-pmc': {
      return json({ intent, result: await actionSubmitToPmc(formData) });
    }
  }

  return { intent };
});

export default function Index() {
  const fetcher = useFetcher<{ intent: string; error?: string; result?: { jobId?: string } }>();
  return (
    <div className="container max-w-3xl mx-auto">
      <div className="p-12 space-y-6 font-sans">
        <h1 className="text-3xl">PMC Prototyping</h1>
        <div className="rounded bg-green-200 p-1">Form Action: {fetcher.data?.intent}</div>
        <div className="space-y-3">
          <h2 className="text-2xl">Upload files</h2>
          <div className="py-16 text-center bg-gray-100 border border-gray-500 border-dashed rounded">
            will be a dropzone
          </div>
          <div className="flex items-center gap-2">
            <input
              name="file-1-filename"
              type="text"
              value="./manuscript.docx"
              className="flex-grow p-1 border border-gray-300 rounded"
            />
            <div>Type:</div>
            <input
              name="file-1-kind"
              type="text"
              value="Manuscript"
              className="flex-grow p-1 border border-gray-300 rounded"
            />
            <div>X</div>
          </div>
          <div className="flex items-center gap-2">
            <input
              name="file-2-filename"
              type="text"
              value="./figures.zip"
              className="flex-grow p-1 border border-gray-300 rounded"
            />
            <div>Type:</div>
            <input
              name="file-2-kind"
              type="text"
              value="Figures"
              className="flex-grow p-1 border border-gray-300 rounded"
            />
            <div>X</div>
          </div>
        </div>
        <fetcher.Form className="space-y-3" method="post">
          <h2 className="text-2xl">Metadata</h2>
          <div className="flex gap-2 item-end">
            <div className="flex flex-col flex-grow max-w-sm">
              <label id="doi-label" htmlFor="doi" className="text-xs">
                DOI
              </label>
              <input
                type="text"
                name="doi"
                className="p-1 border border-gray-300 rounded"
                placeholder="e.g. 10.1038/s41467-024-48562-0 or full URL"
                value="10.1038/s41467-024-48562-0"
                aria-labelledby="doi-label"
                disabled
              />
            </div>
            <div className="flex items-end">
              <button
                name="intent"
                value="check-doi"
                className="px-4 py-1 text-white bg-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed rounded"
                disabled
              >
                Check DOI
              </button>
            </div>
          </div>
        </fetcher.Form>
        <fetcher.Form className="space-y-3" method="post">
          <div className="flex flex-col items-start gap-3">
            <button
              name="intent"
              value="submit-to-pmc"
              className="px-4 py-1 text-white bg-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed rounded"
            >
              Submit to PMC
            </button>
            {fetcher.state === 'loading' && fetcher.formData?.get('intent') === 'submit-to-pmc' && (
              <div className=" text-green-500">Submitting...</div>
            )}
            {fetcher.data?.intent === 'submit-to-pmc' && (
              <div className="text-green-500">Started job {fetcher.data.result?.jobId}</div>
            )}
            <details>
              <summary>Manifest</summary>
              <pre className="text-sm">{JSON.stringify(manifest, null, 2)}</pre>
            </details>
          </div>
        </fetcher.Form>
      </div>
    </div>
  );
}
