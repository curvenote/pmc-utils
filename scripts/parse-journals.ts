import * as fs from 'fs';
import * as path from 'path';

// Interface for the journal entry
interface JournalEntry {
  JrId: number;
  JournalTitle: string;
  MedAbbr: string;
  ISSNPrint: string;
  ISSNOnline: string;
  IsoAbbr: string;
  NlmId: string;
}

// Function to parse a single journal entry block
function parseEntry(entry: string): JournalEntry | null {
  const lines = entry.split('\n').filter((line) => line.trim() !== '');
  const journal: any = {};

  for (const line of lines) {
    const [key, value] = line.split(/:\s(.+)/);

    switch (key.trim()) {
      case 'JrId':
        journal.JrId = parseInt(value.trim(), 10);
        break;
      case 'JournalTitle':
        journal.JournalTitle = value.trim();
        break;
      case 'MedAbbr':
        journal.MedAbbr = value.trim();
        break;
      case 'ISSN (Print)':
        journal.ISSNPrint = value.trim();
        break;
      case 'ISSN (Online)':
        journal.ISSNOnline = value.trim();
        break;
      case 'IsoAbbr':
        journal.IsoAbbr = value.trim();
        break;
      case 'NlmId':
        journal.NlmId = value.trim();
        break;
    }
  }

  return journal;
}

// Function to load and parse the file
function parseJournalsFile(filePath: string): JournalEntry[] {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const entries = fileContent
    .split('--------------------------------------------------------')
    .map((entry) => entry.trim())
    .filter((entry) => entry !== '');

  const journalEntries: JournalEntry[] = entries.map(parseEntry).filter(Boolean) as JournalEntry[];
  return journalEntries;
}

// Get the file path from the command line arguments
const filePath = process.argv[2];

// Check if the file path is provided
if (!filePath) {
  console.error('Please provide the path to the journals text file as a command line argument.');
  process.exit(1);
}

// Resolve the full path and check if the file exists
const resolvedFilePath = path.resolve(filePath);

if (!fs.existsSync(resolvedFilePath)) {
  console.error(`File not found: ${resolvedFilePath}`);
  process.exit(1);
}

// Parse the file and convert to JSON
const journalEntries = parseJournalsFile(resolvedFilePath);

// Output the JSON
const jsonOutput = JSON.stringify(journalEntries, null, 2);

// Optionally, save the JSON to a file (if you want to save it uncomment the line below)

fs.writeFileSync(path.join(path.dirname(resolvedFilePath), 'journals.json'), jsonOutput, 'utf-8');
