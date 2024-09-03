import type { MetaFunction } from '@remix-run/node';
import { json, useFetcher } from '@remix-run/react';
import { withContext } from '../backend/context';
import { processPMCSubmission, startPMCSubmission } from '../backend';
import { AAMDepositManifest } from '../../../packages/client/dist/types';
import { useEffect, useState } from 'react';

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
  taskId: 'task-1234',
  agency: 'hhmi',
  files: [
    {
      filename: 'manuscript.docx',
      type: 'manuscript', // validate against a list of known types
      label: '1',
      storage: 'local',
      path: './data',
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    },
    {
      filename: 'figure1.png',
      type: 'figure', // validate against a list of known types
      label: 'Figure 1',
      storage: 'local',
      path: './data',
      contentType: 'image/png',
    },
    {
      filename: 'table1.csv',
      type: 'table', // validate against a list of known types
      label: 'Table 1',
      storage: 'local',
      path: './data',
      contentType: 'text/csv',
    },
    {
      filename: 'figures.docx',
      type: 'supplement', // validate against a list of known types
      label: 'Supplementary Figures',
      storage: 'local',
      path: './data',
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    },
  ],
  doi: '10.1038/s41467-024-48562-0',
  metadata: {
    title: 'Title', // required
    journal: {
      issn: '1234-567',
      issnType: 'electronic',
      title: 'Journal',
      shortTitle: 'J.',
    },
    authors: [
      // one is required or type reviewer
      { fname: 'First', lname: 'Last', email: 'first.last@curvenote.org', contactType: 'reviewer' },
    ],
    funding: [{ funder: 'hhmi' }, { funder: 'nih', grantId: 'q1w2e3r4' }], // can be empty
  },
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function actionSubmitToPmc(formData: FormData) {
  const result = await startPMCSubmission(manifest);
  return result;
}

async function actionProcessSubmission(formData: FormData) {
  const jobId = formData.get('jobId') as string;
  const status = await processPMCSubmission(jobId);

  return { jobId, status };
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
    case 'process-deposit': {
      return json({ intent, result: await actionProcessSubmission(formData) });
    }
  }

  return { intent };
});

export default function Index() {
  const fetcher = useFetcher<{ intent: string; error?: string; result?: { jobId?: string } }>();
  const [intents, setIntents] = useState<string[]>([]);

  useEffect(() => {
    if (fetcher.data && fetcher.data.intent) {
      setIntents((prev) => (fetcher.data?.intent ? [...prev, fetcher.data.intent] : prev));
    }
  }, [fetcher.data]);

  return (
    <div className="container max-w-3xl mx-auto">
      <div className="p-12 space-y-6 font-sans">
        <h1 className="text-3xl">PMC Prototyping</h1>
        <div>
          {intents.map((intent, i) => (
            <div key={`${intent}-${i}`} className="rounded bg-green-200 p-1">
              Form Action: {intent}
            </div>
          ))}
        </div>
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
        <fetcher.Form className="space-y-3" method="post">
          <button
            name="intent"
            value="process-deposit"
            className="px-4 py-1 text-black bg-orange-300 disabled:bg-gray-400 disabled:cursor-not-allowed rounded"
          >
            🤖 Process
          </button>
        </fetcher.Form>
      </div>
    </div>
  );
}
